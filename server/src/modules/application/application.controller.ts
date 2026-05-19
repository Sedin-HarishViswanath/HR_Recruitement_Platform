import { Request, Response } from 'express';
import { applicationService } from './application.service';
import { 
  applySchema, 
  stageTransitionSchema, 
  bulkMoveSchema 
} from './application.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class ApplicationController {
  async applyToJob(req: Request, res: Response) {
    try {
      const candidateId = req.user.userId;
      // In this system, candidateId might be different from userId if we have a candidates table.
      // Assuming req.user contains the correct IDs.
      const id = req.user.candidateId || req.user.userId;

      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const application = await applicationService.applyToJob(id, parsed.data);
      return sendResponse(res, 201, true, 'Application submitted successfully', application);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async listCompanyApplications(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      if (!companyId) throw new AppError('Unauthorized', 401);

      const result = await applicationService.listCompanyApplications(companyId, req.query);
      return sendResponse(res, 200, true, 'Applications retrieved', result);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async updateStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const parsed = stageTransitionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const application = await applicationService.updateApplicationStage(id as string, userId, req.user.companyId, parsed.data);
      return sendResponse(res, 200, true, 'Stage updated successfully', application);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await applicationService.getHistory(id as string);
      return sendResponse(res, 200, true, 'Stage history retrieved', history);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getPipeline(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const pipeline = await applicationService.getPipeline(jobId as string);
      return sendResponse(res, 200, true, 'Pipeline data retrieved', pipeline);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getPipelineSummary(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const summary = await applicationService.getPipelineSummary(jobId as string);
      return sendResponse(res, 200, true, 'Pipeline summary retrieved', summary);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async bulkMove(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const parsed = bulkMoveSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const result = await applicationService.bulkMove(userId, req.user.companyId, parsed.data);
      return sendResponse(res, 200, true, 'Bulk movement successful', result);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async updateNotes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const application = await applicationService.updateNotes(id as string, notes);
      return sendResponse(res, 200, true, 'Notes updated successfully', application);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }
}

export const applicationController = new ApplicationController();
