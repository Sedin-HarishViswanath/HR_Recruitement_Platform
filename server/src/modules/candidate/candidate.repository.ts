import { db as knex } from '../../config/db';

export class CandidateRepository {
  async findById(candidateId: string) {
    return knex('candidates').where({ id: candidateId }).first();
  }

  async updateProfile(candidateId: string, data: any) {
    const [updated] = await knex('candidates')
      .where({ id: candidateId })
      .update(data)
      .returning('*');
    return updated;
  }

  async getRecentApplications(candidateId: string, limit = 3) {
    return knex('applications')
      .select(
        'applications.id',
        'applications.status',
        'applications.applied_at',
        'jobs.title as job_title',
        'companies.name as company_name'
      )
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .where('applications.candidate_id', candidateId)
      .orderBy('applications.applied_at', 'desc')
      .limit(limit);
  }

  async getUpcomingInterviews(candidateId: string, limit = 2) {
    return knex('interviews')
      .select(
        'interviews.id',
        'interviews.round_type',
        'interviews.scheduled_at',
        'interviews.status',
        'interviews.meeting_link',
        'jobs.title as job_title',
        'companies.name as company_name'
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .where('applications.candidate_id', candidateId)
      .where('interviews.status', 'scheduled')
      .where('interviews.scheduled_at', '>', knex.fn.now())
      .orderBy('interviews.scheduled_at', 'asc')
      .limit(limit);
  }

  async getRecommendedJobs(skills: string[], limit = 4) {
    if (!skills || skills.length === 0) return [];
    
    // Using Postgres array overlap operator '&&'
    return knex('jobs')
      .select(
        'jobs.id',
        'jobs.title',
        'jobs.location',
        'jobs.department',
        'companies.name as company_name'
      )
      .join('companies', 'jobs.company_id', 'companies.id')
      .where('jobs.status', 'published')
      .whereRaw('jobs.required_skills && ?::text[]', [skills])
      .limit(limit);
  }

  async getStats(candidateId: string) {
    const [totalApps] = await knex('applications')
      .where({ candidate_id: candidateId })
      .count('* as count');
      
    const [activeApps] = await knex('applications')
      .where({ candidate_id: candidateId })
      .whereNotIn('status', ['rejected', 'withdrawn'])
      .count('* as count');
      
    const [scheduledInterviews] = await knex('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .where('applications.candidate_id', candidateId)
      .where('interviews.status', 'scheduled')
      .count('* as count');

    return {
      totalApplications: parseInt(totalApps?.count as string || '0'),
      activeApplications: parseInt(activeApps?.count as string || '0'),
      scheduledInterviews: parseInt(scheduledInterviews?.count as string || '0'),
    };
  }

  async getApplications(candidateId: string, query: any) {
    let q = knex('applications')
      .select(
        'applications.*',
        'jobs.title as job_title',
        'companies.name as company_name'
      )
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .where('applications.candidate_id', candidateId)
      .orderBy('applications.applied_at', 'desc');

    if (query.status) {
      q = q.where('applications.status', query.status);
    }
    
    if (query.search) {
      q = q.whereILike('jobs.title', `%${query.search}%`);
    }
    
    return q;
  }

  async getApplicationById(candidateId: string, applicationId: string) {
    return knex('applications')
      .select(
        'applications.*',
        'jobs.title as job_title',
        'companies.name as company_name',
        'jobs.description as job_description'
      )
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .where('applications.id', applicationId)
      .where('applications.candidate_id', candidateId)
      .first();
  }

  async withdrawApplication(candidateId: string, applicationId: string) {
    return knex('applications')
      .where({ id: applicationId, candidate_id: candidateId })
      .whereNotIn('status', ['hired', 'rejected'])
      .update({ status: 'withdrawn' })
      .returning('*');
  }

  async getInterviews(candidateId: string, query: any) {
    let q = knex('interviews')
      .select(
        'interviews.*',
        'jobs.title as job_title',
        'companies.name as company_name',
        'users.name as interviewer_name'
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .leftJoin('users', 'interviews.interviewer_id', 'users.id')
      .where('applications.candidate_id', candidateId)
      .orderBy('interviews.scheduled_at', 'asc');

    if (query.status) {
      q = q.where('interviews.status', query.status);
    }
    if (query.round_type) {
      q = q.where('interviews.round_type', query.round_type);
    }

    return q;
  }

  async getCompanyCandidates(companyId: string, query: any) {
    // Basic implementation for company view
    let q = knex('candidates')
      .select(
        'candidates.id',
        'candidates.name',
        'candidates.email',
        'candidates.phone',
        'candidates.skills',
        'candidates.ai_match_score'
      )
      .count('applications.id as applied_jobs_count')
      .max('applications.status as overall_status')
      .min('applications.applied_at as first_applied_date')
      .join('applications', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .groupBy('candidates.id');

    if (query.search) {
      q = q.whereILike('candidates.name', `%${query.search}%`);
    }

    return q;
  }
}

export const candidateRepository = new CandidateRepository();
