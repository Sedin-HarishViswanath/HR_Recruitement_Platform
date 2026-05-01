import { db } from '../../config/db';
import { ApplyInput } from './application.schema';
import { AppError } from '../../shared/errors/AppError';

export class ApplicationService {
  async applyToJob(candidateId: string, data: ApplyInput) {
    const { job_id, cover_note, resume_url } = data;

    return await db.transaction(async (trx) => {
      // 1. Check if job exists and is published
      const job = await trx('jobs').where({ id: job_id, status: 'published', deleted_at: null }).first();
      if (!job) throw new AppError('Job is not available for applications', 400);

      // Check deadline
      if (job.deadline && new Date(job.deadline) < new Date()) {
        throw new AppError('Job application deadline has passed', 400);
      }

      // 2. Check if already applied
      const existing = await trx('applications').where({ job_id, candidate_id: candidateId }).first();
      if (existing) throw new AppError('You have already applied to this job', 409);

      // 3. Get candidate details (skills, resume)
      const candidate = await trx('candidates').where({ id: candidateId }).first();
      if (!candidate) throw new AppError('Candidate profile not found', 404);

      // Require some basic profile completeness if needed
      // if (!candidate.onboarding_completed) throw new AppError('Please complete your profile before applying', 400);

      const finalResumeUrl = resume_url || candidate.resume_url;
      if (!finalResumeUrl) throw new AppError('A resume is required to apply', 400);

      // 4. Create application
      const [application] = await trx('applications')
        .insert({
          job_id,
          candidate_id: candidateId,
          status: 'applied',
          resume_url: finalResumeUrl,
          cover_note,
          parsed_skills: candidate.skills || [], // Snapshot skills at time of application
        })
        .returning('*');

      // TODO: Send notification email to candidate
      return application;
    });
  }
}

export const applicationService = new ApplicationService();
