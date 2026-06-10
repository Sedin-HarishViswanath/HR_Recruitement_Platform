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
  async applyToJob(candidateId: string, data: ApplyInput, resumeText?: string) {
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

      const finalResumeText = resumeText || candidate.resume_text;

      // 4. Create application
      const { ai_score, matched_skills } = await atsScreeningService.screenResume(
        candidate.skills || [],
        job,
        finalResumeText || undefined,
      );

      const [application] = await trx('applications')
        .insert({
          job_id,
          candidate_id: candidateId,
          status: 'new',
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
        changed_by: null, // Candidate-initiated transitions have no company user owner
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

  async updateApplicationStage(id: string, userId: string, companyId: string, data: StageTransitionInput) {
    const { stage, notes } = data;

    return await db.transaction(async (trx) => {
      const application = await applicationRepository.findById(id);
      if (!application) throw new AppError('Application not found', 404);

      // Verify userId belongs to the same company as the application
      if (companyId && application.company_id && application.company_id.toString() !== companyId) {
        throw new AppError('Unauthorized to update this application', 403);
      }

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
      new: [],
      applied: [],
      screening: [],
      shortlisted: [],
      interview_1: [],
      interview_2: [],
      interview_3: [],
      interview_4: [],
      interview_5: [],
      offer: [],
      hired: [],
      rejected: []
    };

    data.forEach(app => {
      const status = app.status || 'new';
      if (pipeline[status]) {
        pipeline[status].push(app);
      } else {
        // Fallback for dynamic interview rounds beyond 5
        if (!pipeline[status]) {
          pipeline[status] = [];
        }
        pipeline[status].push(app);
      }
    });

    return pipeline;
  }

  async getPipelineSummary(jobId: string) {
    return applicationRepository.getPipelineSummary(jobId);
  }

  async bulkMove(userId: string, companyId: string, data: BulkMoveInput) {
    const { application_ids, target_stage } = data;

    return await db.transaction(async (trx) => {
      // Validate all applications exist and belong to the same company
      const applications = await trx('applications')
        .join('jobs', 'applications.job_id', 'jobs.id')
        .whereIn('applications.id', application_ids)
        .select('applications.id', 'jobs.company_id');

      if (applications.length !== application_ids.length) {
        throw new AppError('One or more applications not found', 404);
      }

      const unauthorized = applications.some(app => app.company_id.toString() !== companyId);
      if (unauthorized) {
        throw new AppError('Unauthorized to move one or more applications', 403);
      }
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
