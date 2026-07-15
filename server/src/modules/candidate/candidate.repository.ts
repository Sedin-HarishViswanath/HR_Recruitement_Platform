import { db as knex } from '../../config/db';

// jsonb columns on `candidates`. Postgres serializes a raw JS array parameter
// as an array literal ({...}), which is invalid JSON for a jsonb column, so any
// object/array bound for these columns must be JSON.stringify'd first. (`skills`
// is text[] and must stay a raw JS array — do NOT include it here.)
const CANDIDATE_JSONB_COLUMNS = ['experience', 'preferences', 'resume_data'] as const;

function serializeJsonbColumns(data: any): any {
  const out = { ...data };
  for (const col of CANDIDATE_JSONB_COLUMNS) {
    if (col in out && out[col] != null && typeof out[col] !== 'string') {
      out[col] = JSON.stringify(out[col]);
    }
  }
  return out;
}

export class CandidateRepository {
  async findById(candidateId: string) {
    return knex('candidates').where({ id: candidateId }).first();
  }

  /** Increment a candidate's recruiter profile-view counter. */
  async incrementProfileViews(candidateId: string) {
    return knex('candidates').where({ id: candidateId }).increment('profile_views', 1);
  }

  async updateProfile(candidateId: string, data: any) {
    const [updated] = await knex('candidates')
      .where({ id: candidateId })
      .update(serializeJsonbColumns(data))
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
      .whereNotIn('applications.status', ['rejected', 'withdrawn'])
      .orderBy('interviews.scheduled_at', 'asc')
      .limit(limit);
  }

  async getRecommendedJobs(candidateId: string, skills: string[], limit = 4) {
    if (!skills || skills.length === 0) return [];

    const appliedJobIds = await knex('applications')
      .where('candidate_id', candidateId)
      .pluck('job_id');

    let q = knex('jobs')
      .select(
        'jobs.id',
        'jobs.title',
        'jobs.location',
        'jobs.department',
        'jobs.required_skills',
        'companies.name as company_name'
      )
      .join('companies', 'jobs.company_id', 'companies.id')
      .where('jobs.status', 'published')
      .whereRaw('jobs.required_skills && ?::text[]', [skills]);

    if (appliedJobIds.length > 0) {
      q = q.whereNotIn('jobs.id', appliedJobIds);
    }

    const jobs = await q.limit(limit);

    // Compute a skill-overlap match score (% of the job's required skills the
    // candidate has). Case-insensitive so "Node.js" matches "node.js".
    const candidateSkills = new Set(skills.map((s) => s.toLowerCase().trim()));
    return jobs
      .map((job: any) => {
        const required: string[] = Array.isArray(job.required_skills) ? job.required_skills : [];
        const matched = required.filter((s) => candidateSkills.has(String(s).toLowerCase().trim()));
        const match_score = required.length > 0
          ? Math.round((matched.length / required.length) * 100)
          : 0;
        return { ...job, match_score };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score);
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

    // Average AI fit score across this candidate's applications.
    const [avgMatch] = await knex('applications')
      .where({ candidate_id: candidateId })
      .whereNotNull('ai_score')
      .avg('ai_score as avg');

    // Recruiter profile views (incremented when a company opens the candidate).
    const profile = await knex('candidates').select('profile_views').where({ id: candidateId }).first();

    return {
      totalApplications: parseInt(totalApps?.count as string || '0'),
      activeApplications: parseInt(activeApps?.count as string || '0'),
      scheduledInterviews: parseInt(scheduledInterviews?.count as string || '0'),
      averageMatchScore: avgMatch?.avg != null ? Math.round(Number(avgMatch.avg)) : 0,
      profileViews: Number(profile?.profile_views || 0),
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
      .whereNotIn('applications.status', ['rejected', 'withdrawn'])
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
        'candidates.location',
        'candidates.summary',
        'candidates.resume_url',
        'candidates.linkedin_url',
        'candidates.github_url',
        'candidates.portfolio_url',
        'candidates.profile_completion',
        'candidates.skills',
        'candidates.ai_match_score',
        knex.raw("string_agg(distinct jobs.department, ',') as departments")
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
