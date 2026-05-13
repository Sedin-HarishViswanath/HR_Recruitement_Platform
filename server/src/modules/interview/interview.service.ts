import { db } from '../../config/db';
import { env } from '../../config/env';
import { notificationService } from '../notification/notification.service';
import { interviewRepository } from './interview.repository';
import { AppError } from '../../shared/errors/AppError';
import { executeWithPiston } from './code-execution.service';
import { dailyCoService } from './daily-co.service';
import { 
  ScheduleInterviewInput, 
  RescheduleInterviewInput, 
  FeedbackInput 
} from './interview.schema';

export class InterviewService {
  async scheduleInterview(data: ScheduleInterviewInput) {
    const { application_id, interviewer_id, scheduled_at, duration } = data;
    const date = new Date(scheduled_at);

    // 1. Conflict Check
    const conflict = await interviewRepository.checkConflict(interviewer_id, date, duration);
    if (conflict) throw new AppError('Interviewer has a scheduling conflict at this time', 400);

    return await db.transaction(async (trx) => {
      const [interview] = await trx('interviews')
        .insert({
          application_id,
          interviewer_id,
          round_type: data.round_type,
          duration: duration || 60,
          scheduled_at: date,
          status: 'scheduled',
          meeting_link: ''
        })
        .returning('*');

      const meeting_link = `${env.FRONTEND_URL}/interview/${interview.id}`;
      await trx('interviews').where({ id: interview.id }).update({ meeting_link });
      interview.meeting_link = meeting_link;

      // Update application status to 'interview' if it's not already
      await trx('applications')
        .where({ id: application_id })
        .update({ status: 'interview', updated_at: db.fn.now() });

      // Notify candidate
      const candidate = await trx('candidates')
        .join('applications', 'candidates.id', 'applications.candidate_id')
        .where('applications.id', application_id)
        .select('candidates.*')
        .first();
      
      const job = await trx('jobs')
        .join('applications', 'jobs.id', 'applications.job_id')
        .where('applications.id', application_id)
        .select('jobs.title')
        .first();

      void notificationService.notifyInterviewScheduled(candidate, job, interview).catch(err => console.error('Failed to send interview notification email:', err));
      
      return interview;
    });
  }

  async getInterviewById(id: string) {
    return db('interviews')
      .select(
        'interviews.*',
        'candidates.name as candidate_name',
        'candidates.email as candidate_email',
        'jobs.title as job_title',
        'companies.name as company_name',
        'users.name as interviewer_name',
        'users.email as interviewer_email',
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .leftJoin('users', 'interviews.interviewer_id', 'users.id')
      .where('interviews.id', id)
      .first();
  }

  async listCompanyInterviews(companyId: string, query: any) {
    return interviewRepository.listInterviews(companyId, query);
  }

  async listInterviewerInterviews(interviewerId: string, query: any) {
    return interviewRepository.listInterviewerInterviews(interviewerId, query);
  }

  async getInterviewerDashboard(interviewerId: string) {
    return interviewRepository.getInterviewerDashboard(interviewerId);
  }

  async submitFeedback(interviewId: string, userId: string, data: FeedbackInput) {
    return await db.transaction(async (trx) => {
      const interview = await trx('interviews').where({ id: interviewId }).first();
      if (!interview) throw new AppError('Interview not found', 404);
      if (interview.interviewer_id !== userId) throw new AppError('Only the assigned interviewer can submit feedback', 403);
      
      const existing = await trx('feedbacks').where({ interview_id: interviewId }).first();
      if (existing) throw new AppError('Feedback already submitted for this interview', 400);

      const [feedback] = await trx('feedbacks')
        .insert({
          interview_id: interviewId,
          ...data
        })
        .returning('*');

      await trx('interviews')
        .where({ id: interviewId })
        .update({ status: 'completed', updated_at: db.fn.now() });

      return feedback;
    });
  }

  async listCompanyFeedback(companyId: string, query: any) {
    return interviewRepository.listFeedback(companyId, query);
  }

  async updateStatus(id: string, status: string) {
    return db('interviews').where({ id }).update({ status, updated_at: db.fn.now() }).returning('*');
  }

  async saveCodeSnapshot(id: string, snapshot: any) {
    return db('interviews')
      .where({ id })
      .update({
        code_snapshots: db.raw('code_snapshots || ?::jsonb', [JSON.stringify(snapshot)])
      });
  }

  async submitAptitudeResult(id: string, result: any) {
    const interview = await db('interviews').where({ id }).first();
    if (!interview) throw new AppError('Interview not found', 404);
    if (interview.round_type !== 'aptitude') throw new AppError('This is not an aptitude round', 400);
    
    return db('interviews')
      .where({ id })
      .update({
        status: 'completed',
        aptitude_score: result.score,
        updated_at: db.fn.now()
      })
      .returning('*');
  }

  async getMeetingRoom(interviewId: string, participantName: string, isOwner: boolean) {
    const room = await dailyCoService.getOrCreateRoom(interviewId);
    const token = await dailyCoService.createParticipantToken(room.name, participantName, isOwner);
    return { roomUrl: room.url, token };
  }

  async executeCode(data: any) {
    const { script, language, stdin } = data;
    const result = await executeWithPiston({ language, code: script, stdin });
    return result;
  }
}

export const interviewService = new InterviewService();
