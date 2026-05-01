import { db } from '../../config/db';
import { CreateJobInput, UpdateJobInput, ChangeJobStatusInput } from './job.schema';
import { AppError } from '../../shared/errors/AppError';

export class JobService {
  async createJob(companyId: string, createdById: string, data: CreateJobInput) {
    const jobData = {
      ...data,
      company_id: companyId,
      created_by_id: createdById,
      published_at: data.status === 'published' ? new Date() : null,
      // Deduplicate skills array if provided
      required_skills: data.required_skills ? Array.from(new Set(data.required_skills)) : [],
    };

    const [job] = await db('jobs').insert(jobData).returning('*');
    return job;
  }

  async getCompanyJobs(companyId: string, query: { search?: string; status?: string; department?: string; page?: string; limit?: string; sort?: string }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '12');
    const offset = (page - 1) * limit;

    let dbQuery = db('jobs').where({ company_id: companyId, deleted_at: null });

    if (query.search) {
      dbQuery = dbQuery.where('title', 'ilike', `%${query.search}%`);
    }
    if (query.status) {
      dbQuery = dbQuery.where('status', query.status);
    }
    if (query.department) {
      dbQuery = dbQuery.where('department', query.department);
    }

    // Clone query for counting
    const countQuery = dbQuery.clone().count('id as count').first();
    
    // Add sorting and pagination
    if (query.sort === 'created_at:asc') {
      dbQuery = dbQuery.orderBy('created_at', 'asc');
    } else {
      dbQuery = dbQuery.orderBy('created_at', 'desc');
    }

    const [jobs, totalCountResult] = await Promise.all([
      dbQuery
        .select('jobs.*')
        .select(
          db.raw('(SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id) as applicant_count')
        )
        .limit(limit)
        .offset(offset),
      countQuery
    ]);

    const total = parseInt(totalCountResult?.count as string || '0');

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getJobDetail(jobId: string, companyId: string) {
    const job = await db('jobs')
      .select('jobs.*')
      .select(
        db.raw('(SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id) as applicant_count')
      )
      .where({ 'jobs.id': jobId, 'jobs.company_id': companyId, deleted_at: null })
      .first();

    if (!job) throw new AppError('Job not found', 404);

    return job;
  }

  async updateJob(jobId: string, companyId: string, data: UpdateJobInput) {
    const job = await db('jobs').where({ id: jobId, company_id: companyId, deleted_at: null }).first();
    if (!job) throw new AppError('Job not found', 404);

    if (data.required_skills) {
      data.required_skills = Array.from(new Set(data.required_skills));
    }

    const [updated] = await db('jobs')
      .where({ id: jobId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  async changeJobStatus(jobId: string, companyId: string, status: ChangeJobStatusInput['status']) {
    const job = await db('jobs').where({ id: jobId, company_id: companyId, deleted_at: null }).first();
    if (!job) throw new AppError('Job not found', 404);

    // Basic transition rules
    if (job.status === status) return job;

    let published_at = job.published_at;
    if (status === 'published' && !published_at) {
      published_at = new Date();
    }

    const [updated] = await db('jobs')
      .where({ id: jobId })
      .update({ status, published_at, updated_at: new Date() })
      .returning('*');

    return updated;
  }

  async deleteJob(jobId: string, companyId: string) {
    const job = await db('jobs').where({ id: jobId, company_id: companyId, deleted_at: null }).first();
    if (!job) throw new AppError('Job not found', 404);

    const applications = await db('applications').where({ job_id: jobId }).count('id as count').first();
    const appCount = parseInt(applications?.count as string || '0');

    if (appCount > 0) {
      throw new AppError('Cannot delete job with existing applications. Please close the job instead.', 400);
    }

    await db('jobs').where({ id: jobId }).update({ deleted_at: new Date() });
    return { success: true };
  }

  // PUBLIC / CANDIDATE METHODS
  async getPublicJobs(query: any, candidateId?: string) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '12');
    const offset = (page - 1) * limit;

    let dbQuery = db('jobs')
      .join('companies', 'jobs.company_id', 'companies.id')
      .where({ 'jobs.status': 'published', 'jobs.deleted_at': null })
      .andWhere(function() {
        this.whereNull('jobs.deadline').orWhere('jobs.deadline', '>', new Date());
      });

    if (query.search) {
      dbQuery = dbQuery.andWhere(function() {
        this.where('jobs.title', 'ilike', `%${query.search}%`)
            .orWhere('companies.name', 'ilike', `%${query.search}%`);
      });
    }
    if (query.location) {
      dbQuery = dbQuery.where('jobs.location', 'ilike', `%${query.location}%`);
    }
    if (query.type) {
      const types = query.type.split(',');
      dbQuery = dbQuery.whereIn('jobs.employment_type', types);
    }
    if (query.experience) {
      dbQuery = dbQuery.where('jobs.experience_level', query.experience);
    }
    if (query.skills) {
      const skills = query.skills.split(',');
      dbQuery = dbQuery.whereRaw('jobs.required_skills && ?::text[]', [skills]);
    }
    if (query.salary_min) {
      dbQuery = dbQuery.where('jobs.salary_max', '>=', query.salary_min);
    }
    if (query.salary_max) {
      dbQuery = dbQuery.where('jobs.salary_min', '<=', query.salary_max);
    }

    const countQuery = dbQuery.clone().count('jobs.id as count').first();

    // Select fields and optionally apply status if candidate authenticated
    dbQuery = dbQuery
      .select('jobs.*', 'companies.name as company_name', 'companies.domain as company_domain')
      .orderBy('jobs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (candidateId) {
      dbQuery = dbQuery.select(
        db.raw(`EXISTS (SELECT 1 FROM applications WHERE applications.job_id = jobs.id AND applications.candidate_id = ?) as already_applied`, [candidateId])
      );
    }

    const [jobs, totalCountResult] = await Promise.all([dbQuery, countQuery]);
    const total = parseInt(totalCountResult?.count as string || '0');

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getPublicJobDetail(jobId: string, candidateId?: string) {
    let dbQuery = db('jobs')
      .join('companies', 'jobs.company_id', 'companies.id')
      .select('jobs.*', 'companies.name as company_name', 'companies.domain as company_domain')
      .where({ 'jobs.id': jobId, 'jobs.status': 'published', 'jobs.deleted_at': null });

    if (candidateId) {
      dbQuery = dbQuery.select(
        db.raw(`EXISTS (SELECT 1 FROM applications WHERE applications.job_id = jobs.id AND applications.candidate_id = ?) as already_applied`, [candidateId])
      );
    }

    const job = await dbQuery.first();
    if (!job) throw new AppError('Job not found or no longer available', 404);

    return job;
  }
}

export const jobService = new JobService();
