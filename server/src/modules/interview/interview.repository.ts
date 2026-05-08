import { db } from '../../config/db';

export class InterviewRepository {
  async listInterviews(companyId: string, query: any) {
    const { 
      status, 
      round_type, 
      interviewer_id, 
      search, 
      date_from, 
      date_to, 
      page = 1, 
      limit = 20 
    } = query;

    let q = db('interviews')
      .select(
        'interviews.*',
        'candidates.name as candidate_name',
        'jobs.title as job_title',
        'users.name as interviewer_name'
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .leftJoin('users', 'interviews.interviewer_id', 'users.id')
      .where('jobs.company_id', companyId);

    if (status) q = q.where('interviews.status', status);
    if (round_type) q = q.where('interviews.round_type', round_type);
    if (interviewer_id) q = q.where('interviews.interviewer_id', interviewer_id);

    if (search) {
      q = q.where((builder) => {
        builder.whereILike('candidates.name', `%${search}%`)
               .orWhereILike('jobs.title', `%${search}%`);
      });
    }

    if (date_from) q = q.where('interviews.scheduled_at', '>=', date_from);
    if (date_to) q = q.where('interviews.scheduled_at', '<=', date_to);

    const countQuery = q.clone().clearSelect().count('* as total');
    const [{ total }] = await countQuery;

    const data = await q
      .orderBy('interviews.scheduled_at', 'desc')
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
    return db('interviews')
      .select('interviews.*', 'jobs.company_id')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('interviews.id', id)
      .first();
  }

  async checkConflict(interviewerId: string, scheduledAt: Date, duration: number, excludeId?: string) {
    const endTime = new Date(scheduledAt.getTime() + duration * 60000);
    
    let q = db('interviews')
      .where('interviewer_id', interviewerId)
      .where('status', 'scheduled')
      .where((builder) => {
        builder.whereBetween('scheduled_at', [scheduledAt, endTime])
               .orWhereRaw('scheduled_at + (duration * interval \'1 minute\') BETWEEN ? AND ?', [scheduledAt, endTime]);
      });

    if (excludeId) q = q.whereNot('id', excludeId);
    
    return q.first();
  }

  async getInterviewerDashboard(interviewerId: string) {
    const [total] = await db('interviews').where({ interviewer_id: interviewerId }).count('* as count');
    const [upcoming] = await db('interviews')
      .where({ interviewer_id: interviewerId, status: 'scheduled' })
      .where('scheduled_at', '>', db.fn.now())
      .count('* as count');
    const [completed] = await db('interviews').where({ interviewer_id: interviewerId, status: 'completed' }).count('* as count');
    const [pending] = await db('interviews')
      .leftJoin('feedbacks', 'interviews.id', 'feedbacks.interview_id')
      .where({ interviewer_id: interviewerId, status: 'completed' })
      .whereNull('feedbacks.id')
      .count('* as count');

    return {
      total: parseInt(total?.count as string || '0'),
      upcoming: parseInt(upcoming?.count as string || '0'),
      completed: parseInt(completed?.count as string || '0'),
      pendingFeedback: parseInt(pending?.count as string || '0'),
    };
  }

  async listInterviewerInterviews(interviewerId: string, query: any) {
    let q = db('interviews')
      .select(
        'interviews.*',
        'candidates.name as candidate_name',
        'jobs.title as job_title',
        db.raw('CASE WHEN feedbacks.id IS NULL THEN false ELSE true END as feedback_submitted')
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .leftJoin('feedbacks', 'interviews.id', 'feedbacks.interview_id')
      .where('interviews.interviewer_id', interviewerId);

    if (query.status) q = q.where('interviews.status', query.status);

    return q.orderBy('interviews.scheduled_at', 'asc');
  }

  async listFeedback(companyId: string, query: any) {
    return db('feedbacks')
      .select(
        'feedbacks.*',
        'interviews.round_type',
        'interviews.scheduled_at',
        'candidates.name as candidate_name',
        'jobs.title as job_title',
        'users.name as interviewer_name'
      )
      .join('interviews', 'feedbacks.interview_id', 'interviews.id')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('users', 'interviews.interviewer_id', 'users.id')
      .where('jobs.company_id', companyId)
      .orderBy('feedbacks.created_at', 'desc');
  }
}

export const interviewRepository = new InterviewRepository();
