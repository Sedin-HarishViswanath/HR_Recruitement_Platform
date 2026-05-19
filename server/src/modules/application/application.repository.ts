import { db } from '../../config/db';

export class ApplicationRepository {
  async listApplications(companyId: string, query: any) {
    const { 
      stage, 
      job_id, 
      recruiter_id, 
      search, 
      date_from, 
      date_to, 
      page = 1, 
      limit = 20,
      sort = 'applied_at',
      order = 'desc'
    } = query;

    let q = db('applications')
      .select(
        'applications.*',
        'candidates.name as candidate_name',
        'candidates.email as candidate_email',
        'jobs.title as job_title',
        'jobs.interview_rounds',
        db.raw('(SELECT COALESCE(MAX(interviews.round_number), 0) FROM interviews WHERE interviews.application_id = applications.id) as latest_interview_round'),
        'recruiters.name as assigned_recruiter_name'
      )
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .leftJoin('users as recruiters', 'applications.user_id', 'recruiters.id')
      .where('jobs.company_id', companyId);

    if (stage) q = q.where('applications.status', stage);
    if (job_id) q = q.where('applications.job_id', job_id);
    if (recruiter_id) q = q.where('applications.user_id', recruiter_id);
    
    if (search) {
      q = q.where((builder) => {
        builder.whereILike('candidates.name', `%${search}%`)
               .orWhereILike('candidates.email', `%${search}%`)
               .orWhereILike('jobs.title', `%${search}%`);
      });
    }

    if (date_from) q = q.where('applications.applied_at', '>=', date_from);
    if (date_to) q = q.where('applications.applied_at', '<=', date_to);

    const countQuery = q.clone().clearSelect().count('* as total');
    const [{ total }] = await countQuery;

    const data = await q
      .orderBy(sort, order)
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      data,
      pagination: {
        total: parseInt(total as string),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    };
  }

  async findById(id: string) {
    return db('applications')
      .select('applications.*', 'jobs.company_id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.id', id)
      .first();
  }

  async updateStage(id: string, stage: string, notes?: string) {
    return db('applications')
      .where({ id })
      .update({ status: stage, updated_at: db.fn.now() })
      .returning('*');
  }

  async createTransition(data: any) {
    return db('stage_transitions').insert(data);
  }

  async getHistory(applicationId: string) {
    return db('stage_transitions')
      .select('stage_transitions.*', 'users.name as changed_by_name')
      .join('users', 'stage_transitions.changed_by', 'users.id')
      .where('application_id', applicationId)
      .orderBy('changed_at', 'asc');
  }

  async getPipelineData(jobId: string) {
    return db('applications')
      .select(
        'applications.id',
        'applications.status',
        'applications.ai_score',
        'jobs.title as job_title',
        'jobs.interview_rounds',
        db.raw('(SELECT COALESCE(MAX(interviews.round_number), 0) FROM interviews WHERE interviews.application_id = applications.id) as latest_interview_round'),
        'candidates.name as candidate_name',
        'candidates.skills',
        'candidates.ai_match_score'
      )
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.job_id', jobId)
      .orderBy('applications.updated_at', 'desc');
  }

  async getPipelineSummary(jobId: string) {
    return db('applications')
      .select('status')
      .count('* as count')
      .where('job_id', jobId)
      .groupBy('status');
  }

  async bulkUpdateStage(applicationIds: string[], stage: string) {
    return db('applications')
      .whereIn('id', applicationIds)
      .update({ status: stage, updated_at: db.fn.now() })
      .returning('*');
  }

  async updateInternalNotes(id: string, notes: string) {
    return db('applications')
      .where({ id })
      .update({ internal_notes: notes, updated_at: db.fn.now() })
      .returning('*');
  }
}

export const applicationRepository = new ApplicationRepository();
