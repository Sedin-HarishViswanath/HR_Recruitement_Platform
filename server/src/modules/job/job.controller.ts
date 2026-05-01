import { Request, Response } from 'express';
import { jobService } from './job.service';
import { createJobSchema, updateJobSchema, changeJobStatusSchema } from './job.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class JobController {
  async createJob(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const createdById = req.user.userId;
      
      const parsed = createJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const job = await jobService.createJob(companyId!, createdById!, parsed.data);
      return sendResponse(res, 201, true, 'Job created successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getCompanyJobs(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const result = await jobService.getCompanyJobs(companyId!, req.query);
      return sendResponse(res, 200, true, 'Jobs retrieved successfully', result);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getJobDetail(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      const job = await jobService.getJobDetail(id, companyId!);
      return sendResponse(res, 200, true, 'Job details retrieved', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async updateJob(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      
      const parsed = updateJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const job = await jobService.updateJob(id, companyId!, parsed.data);
      return sendResponse(res, 200, true, 'Job updated successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async changeJobStatus(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      
      const parsed = changeJobStatusSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const job = await jobService.changeJobStatus(id, companyId!, parsed.data.status);
      return sendResponse(res, 200, true, 'Job status updated successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async deleteJob(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      await jobService.deleteJob(id, companyId!);
      return sendResponse(res, 200, true, 'Job deleted successfully');
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }
}

export const jobController = new JobController();
