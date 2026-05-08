import { db } from '../../config/db';
import { notificationService } from '../notification/notification.service';
import { applicationRepository } from './application.repository';
import { AppError } from '../../shared/errors/AppError';
import { 
  ApplyInput, 
  StageTransitionInput, 
  BulkMoveInput, 
  CreateApplicationInput 
} from './application.schema';
import { atsScreeningService } from './ats-screening.service';

export class ApplicationService {
  async applyToJob(candidateId: string, data: ApplyInput) {
    const { job_id, cover_note, resume_url } = data;

    return await db.transaction(async (trx) => {
      // 1. Check if job exists and is published
      const job = await trx('jobs').where({ id: job_id, status: 'published' }).first();
      if (!job) throw new AppError('Job is not available for applications', 400);

      // 2. Check if already applied
      const existing = await trx('applications').where({ job_id, candidate_id: candidateId }).first();
      if (existing) throw new AppError('You have already applied to this job', 409);

      // 3. Get candidate details
      const candidate = await trx('candidates').where({ id: candidateId }).first();
      if (!candidate) throw new AppError('Candidate profile not found', 404);

      const finalResumeUrl = resume_url || candidate.resume_url;
      if (!finalResumeUrl) throw new AppError('A resume is required to apply', 400);

      // 4. Create application
      const { ai_score, matched_skills } = await atsScreeningService.screenResume(candidate.skills || [], job);

      const [application] = await trx('applications')
        .insert({
          job_id,
          candidate_id: candidateId,
          status: ai_score >= 40 ? 'screening' : 'applied', // Auto-move to screening if decent score
          resume_url: finalResumeUrl,
          cover_note,
          parsed_skills: candidate.skills || [],
          ai_score,
          matched_skills: JSON.stringify(matched_skills),
        })
        .returning('*');

      // 5. Create initial transition
      await trx('stage_transitions').insert({
        application_id: application.id,
        to_stage: application.status,
        changed_by: candidate.id, // In this case, the candidate themselves
        notes: `Initial application. AI Score: ${ai_score}%`
      });

      // 6. Notify candidate
      const company = await trx('companies')
        .join('jobs', 'companies.id', 'jobs.company_id')
        .where('jobs.id', job_id)
        .select('companies.name')
        .first();

      void notificationService.notifyApplicationSubmitted(
        { ...candidate, application_id: application.id }, 
        job, 
        company
      );

      return application;
    });
  }

  async listCompanyApplications(companyId: string, query: any) {
    return applicationRepository.listApplications(companyId, query);
  }

  async updateApplicationStage(id: string, userId: string, data: StageTransitionInput) {
    const { stage, notes } = data;

    return await db.transaction(async (trx) => {
      const application = await applicationRepository.findById(id);
      if (!application) throw new AppError('Application not found', 404);

      // TODO: Verify userId belongs to the same company as the application
      // if (application.company_id !== currentUserCompanyId) ...

      const updateData: any = { status: stage, updated_at: db.fn.now() };
      if (stage === 'rejected' && data.notes) {
        updateData.rejection_reason = data.notes;
      }

      const [updated] = await trx('applications')
        .where({ id })
        .update(updateData)
        .returning('*');

      await trx('stage_transitions').insert({
        application_id: id,
        from_stage: application.status,
        to_stage: stage,
        changed_by: userId,
        notes
      });

      // Notify candidate of status update
      const candidate = await trx('candidates').where({ id: application.candidate_id }).first();
      const job = await trx('jobs').where({ id: application.job_id }).first();
      
      void notificationService.notifyStatusUpdate(candidate, job, stage);

      return updated;
    });
  }

  async getHistory(id: string) {
    return applicationRepository.getHistory(id);
  }

  async getPipeline(jobId: string) {
    const data = await applicationRepository.getPipelineData(jobId);
    
    // Group by status
    const pipeline: Record<string, any[]> = {
      applied: [],
      screening: [],
      shortlisted: [],
      interview_1: [],
      interview_2: [],
      offer: [],
      hired: [],
      rejected: []
    };

    data.forEach(app => {
      if (pipeline[app.status]) {
        pipeline[app.status].push(app);
      }
    });

    return pipeline;
  }

  async getPipelineSummary(jobId: string) {
    return applicationRepository.getPipelineSummary(jobId);
  }

  async bulkMove(userId: string, data: BulkMoveInput) {
    const { application_ids, target_stage } = data;

    return await db.transaction(async (trx) => {
      // Validate all applications exist and belong to the same company (TODO)
      
      const updated = await trx('applications')
        .whereIn('id', application_ids)
        .update({ status: target_stage, updated_at: db.fn.now() })
        .returning('*');

      const transitions = updated.map(app => ({
        application_id: app.id,
        to_stage: target_stage,
        changed_by: userId,
        notes: 'Bulk movement'
      }));

      await trx('stage_transitions').insert(transitions);

      return { moved_count: updated.length };
    });
  }

  async updateNotes(id: string, notes: string) {
    return applicationRepository.updateInternalNotes(id, notes);
  }
}

export const applicationService = new ApplicationService();
