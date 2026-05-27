import { db } from '../../config/db';
import { env } from '../../config/env';
import { notificationService } from '../notification/notification.service';
import { interviewRepository } from './interview.repository';
import { AppError } from '../../shared/errors/AppError';
import { executeWithPiston } from './code-execution.service';

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
      const application = await trx('applications')
        .join('jobs', 'applications.job_id', 'jobs.id')
        .where('applications.id', application_id)
        .select('applications.*', 'jobs.interview_rounds')
        .first();

      if (!application) throw new AppError('Application not found', 404);

      const roundInfo = await trx('interviews')
        .where({ application_id })
        .max('round_number as max_round')
        .first();
      const maxRound = Number(roundInfo?.max_round || 0);
      const totalRounds = Number(application.interview_rounds || 1);
      const roundNumber = Math.min(maxRound + 1, totalRounds);

      // 2. Candidate Same-Day Sequential / Conflict Check
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const candidateInterviewsToday = await trx('interviews')
        .join('applications', 'interviews.application_id', 'applications.id')
        .where('applications.candidate_id', application.candidate_id)
        .whereNot('interviews.status', 'cancelled')
        .whereBetween('interviews.scheduled_at', [startOfDay, endOfDay])
        .select('interviews.*');

      for (const existing of candidateInterviewsToday) {
        const existingStart = new Date(existing.scheduled_at).getTime();
        const existingEnd = existingStart + Number(existing.duration || 60) * 60000;
        const newStart = date.getTime();
        const newEnd = newStart + Number(duration || 60) * 60000;

        if (roundNumber > existing.round_number) {
          if (newStart < existingEnd) {
            throw new AppError(
              `Conflict: Round ${roundNumber} must be scheduled after Round ${existing.round_number} ends (ends at ${new Date(existingEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
              400
            );
          }
        } else if (roundNumber < existing.round_number) {
          if (newEnd > existingStart) {
            throw new AppError(
              `Conflict: Round ${roundNumber} must be scheduled before Round ${existing.round_number} starts (starts at ${new Date(existingStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
              400
            );
          }
        } else {
          const hasOverlap = (newStart >= existingStart && newStart < existingEnd) || 
                            (newEnd > existingStart && newEnd <= existingEnd) ||
                            (newStart <= existingStart && newEnd >= existingEnd);
          if (hasOverlap) {
            throw new AppError('Candidate already has an interview scheduled during this time', 400);
          }
        }
      }

      const [interview] = await trx('interviews')
        .insert({
          application_id,
          interviewer_id,
          round_type: data.round_type,
          round_number: roundNumber,
          duration: duration || 60,
          scheduled_at: date,
          status: 'scheduled',
          meeting_link: ''
        })
        .returning('*');

      const meeting_link = `${env.FRONTEND_URL}/interview/${interview.id}`;
      await trx('interviews').where({ id: interview.id }).update({ meeting_link });
      interview.meeting_link = meeting_link;

      // Keep the application stage aligned with the current interview round.
      await trx('applications')
        .where({ id: application_id })
        .update({ status: `interview_${roundNumber}`, updated_at: db.fn.now() });

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
    
    const [updated] = await db('interviews')
      .where({ id })
      .update({
        status: 'completed',
        aptitude_score: result.score,
        updated_at: db.fn.now()
      })
      .returning('*');

    return updated;
  }

  async getMeetingRoom(interviewId: string, participantName: string, isOwner: boolean) {
    const interview = await db('interviews').where({ id: interviewId }).first();
    if (!interview) throw new AppError('Interview not found', 404);

    const roomName = `recruitai-interview-${interviewId}`;
    const roomUrl = `https://meet.jit.si/${roomName}`;

    if (interview.meeting_link !== roomUrl) {
      await db('interviews')
        .where({ id: interviewId })
        .update({ meeting_link: roomUrl });
    }

    return { roomUrl, token: '' };
  }

  async executeCode(data: any) {
    const { script, language, stdin } = data;
    const result = await executeWithPiston({ language, code: script, stdin });
    return result;
  }

  // ─── Transcript Methods ───

  async saveTranscriptEntries(interviewId: string, entries: Array<{ speaker: string; text: string; timestamp: string }>) {
    const interview = await db('interviews').where({ id: interviewId }).first();
    if (!interview) throw new AppError('Interview not found', 404);

    const rows = entries.map(e => ({
      interview_id: interviewId,
      speaker: e.speaker,
      text: e.text,
      timestamp: e.timestamp,
    }));

    return db('interview_transcripts').insert(rows).returning('*');
  }

  async getTranscriptEntries(interviewId: string) {
    return db('interview_transcripts')
      .where({ interview_id: interviewId })
      .orderBy('created_at', 'asc');
  }

  async getCandidateTranscripts(candidateId: string, companyId: string) {
    const interviews = await db('interviews')
      .select(
        'interviews.id',
        'interviews.round_type',
        'interviews.round_number',
        'interviews.scheduled_at',
        'interviews.status',
        'interviews.aptitude_score',
        'interviews.recording_url',
        'users.name as interviewer_name',
        'jobs.title as job_title',
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .leftJoin('users', 'interviews.interviewer_id', 'users.id')
      .where('candidates.id', candidateId)
      .where('jobs.company_id', companyId)
      .orderBy('interviews.scheduled_at', 'asc');

    // For each interview, check if transcript entries exist
    const results = await Promise.all(
      interviews.map(async (iv: any) => {
        const [countRow] = await db('interview_transcripts')
          .where({ interview_id: iv.id })
          .count('id as count');
        return {
          ...iv,
          has_transcript: Number(countRow?.count || 0) > 0,
          transcript_count: Number(countRow?.count || 0),
        };
      })
    );

    return results;
  }

  async requestReschedule(interviewId: string, candidateId: string, data: { reason: string, preferred_date: string }) {
    return await db.transaction(async (trx) => {
      // Find the interview and verify candidate owns it
      const interview = await trx('interviews')
        .join('applications', 'interviews.application_id', 'applications.id')
        .where('interviews.id', interviewId)
        .where('applications.candidate_id', candidateId)
        .select('interviews.*')
        .first();

      if (!interview) {
        throw new AppError('Interview not found or unauthorized', 404);
      }

      if (interview.status !== 'scheduled') {
        throw new AppError('Only scheduled interviews can be rescheduled', 400);
      }

      // Check if there is already a pending reschedule request
      const existing = await trx('reschedule_requests')
        .where({ interview_id: interviewId, status: 'pending' })
        .first();
      if (existing) {
        throw new AppError('A reschedule request is already pending for this interview', 400);
      }

      // Insert reschedule request
      const [request] = await trx('reschedule_requests')
        .insert({
          interview_id: interviewId,
          candidate_id: candidateId,
          reason: data.reason,
          preferred_date: new Date(data.preferred_date),
          status: 'pending',
        })
        .returning('*');

      // Update interview status
      await trx('interviews')
        .where({ id: interviewId })
        .update({ status: 'reschedule_requested', updated_at: db.fn.now() });

      return request;
    });
  }

  async listRescheduleRequests(companyId: string) {
    return db('reschedule_requests')
      .select(
        'reschedule_requests.*',
        'interviews.round_type',
        'interviews.round_number',
        'interviews.scheduled_at as original_date',
        'candidates.name as candidate_name',
        'jobs.title as job_title',
        'users.name as interviewer_name'
      )
      .join('interviews', 'reschedule_requests.interview_id', 'interviews.id')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .leftJoin('users', 'interviews.interviewer_id', 'users.id')
      .where('jobs.company_id', companyId)
      .orderBy('reschedule_requests.created_at', 'desc');
  }

  async handleRescheduleRequest(requestId: string, companyId: string, action: 'approve' | 'reject', newTime?: string) {
    return await db.transaction(async (trx) => {
      const request = await trx('reschedule_requests')
        .join('interviews', 'reschedule_requests.interview_id', 'interviews.id')
        .join('applications', 'interviews.application_id', 'applications.id')
        .join('jobs', 'applications.job_id', 'jobs.id')
        .where('reschedule_requests.id', requestId)
        .where('jobs.company_id', companyId)
        .select('reschedule_requests.*', 'interviews.duration', 'interviews.interviewer_id')
        .first();

      if (!request) {
        throw new AppError('Reschedule request not found', 404);
      }

      if (request.status !== 'pending') {
        throw new AppError('This request has already been processed', 400);
      }

      if (action === 'reject') {
        await trx('reschedule_requests')
          .where({ id: requestId })
          .update({ status: 'rejected', updated_at: db.fn.now() });

        await trx('interviews')
          .where({ id: request.interview_id })
          .update({ status: 'scheduled', updated_at: db.fn.now() });

        return { success: true, message: 'Reschedule request rejected' };
      }

      // Approve flow:
      const scheduleTime = newTime ? new Date(newTime) : new Date(request.preferred_date);

      // Check conflict for interviewer at new time
      const conflict = await interviewRepository.checkConflict(request.interviewer_id, scheduleTime, request.duration);
      if (conflict) {
        throw new AppError('Interviewer has a scheduling conflict at the new proposed time', 400);
      }

      await trx('reschedule_requests')
        .where({ id: requestId })
        .update({ status: 'approved', updated_at: db.fn.now() });

      await trx('interviews')
        .where({ id: request.interview_id })
        .update({
          status: 'scheduled',
          scheduled_at: scheduleTime,
          updated_at: db.fn.now(),
        });

      return { success: true, message: 'Reschedule request approved and interview rescheduled' };
    });
  }
}

export const interviewService = new InterviewService();
