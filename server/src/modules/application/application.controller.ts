import { Request, Response } from 'express';
import { applicationService } from './application.service';
import { applySchema } from './application.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class ApplicationController {
  async applyToJob(req: Request, res: Response) {
    try {
      const candidateId = req.user.userId;
      if (req.user.role !== 'Candidate') {
        throw new AppError('Only candidates can apply to jobs', 403);
      }

      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const application = await applicationService.applyToJob(candidateId, parsed.data);
      return sendResponse(res, 201, true, 'Application submitted successfully', application);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }
}

export const applicationController = new ApplicationController();
