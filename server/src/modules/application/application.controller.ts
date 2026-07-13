import { Request, Response } from 'express';
import { applicationService } from './application.service';
import { 
  applySchema, 
  stageTransitionSchema, 
  bulkMoveSchema 
} from './application.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';
import { resumeParserService } from '../candidate/resume-parser.service';
import { screeningAgentService } from './screening-agent.service';

export class ApplicationController {
  async applyToJob(req: Request, res: Response) {
    try {
      const id = req.user.candidateId || req.user.userId;

      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      let resumeUrl = parsed.data.resume_url;
      let resumeText = undefined;

      if (req.file) {
        resumeUrl = `/uploads/resumes/${req.file.filename}`;
        const parsedPdf = await resumeParserService.parsePdf(req.file.path).catch(() => null);
        if (parsedPdf && parsedPdf.resume_text) {
          resumeText = parsedPdf.resume_text;
        }
      }

      const application = await applicationService.applyToJob(id, {
        ...parsed.data,
        resume_url: resumeUrl,
      }, resumeText);
      
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

  async startScreen(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      if (!companyId) throw new AppError('Unauthorized', 401);
      const { jobId } = req.params;
      const result = await screeningAgentService.run({
        jobId: jobId as string,
        companyId,
        userId,
        limit: Number(req.body?.limit) || undefined,
        force: req.body?.force === true,
      });
      return sendResponse(res, 202, true, 'Screening started', result);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to start screening');
    }
  }

  async getScreenState(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      if (!companyId) throw new AppError('Unauthorized', 401);
      const { jobId } = req.params;
      const state = await screeningAgentService.getState(jobId as string, companyId);
      return sendResponse(res, 200, true, 'Screening state retrieved', state);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to retrieve screening state');
    }
  }

  async getApplicationFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db } = await import('../../config/db');
      // Use interviews as the base with LEFT JOIN to feedbacks so all rounds appear
      // (including aptitude rounds which have scores but no feedback record)
      const feedback = await db('interviews')
        .select(
          'feedbacks.id',
          'feedbacks.rating',
          'feedbacks.strengths',
          'feedbacks.weaknesses',
          'feedbacks.recommendation',
          'feedbacks.additional_comments',
          'feedbacks.created_at',
          'interviews.id as interview_id',
          'interviews.round_type',
          'interviews.round_number',
          'interviews.scheduled_at',
          'interviews.aptitude_score',
          'interviews.status as interview_status',
          'users.name as interviewer_name'
        )
        .leftJoin('feedbacks', 'feedbacks.interview_id', 'interviews.id')
        .leftJoin('users', 'interviews.interviewer_id', 'users.id')
        .where('interviews.application_id', id)
        .whereNot('interviews.status', 'cancelled')
        .orderBy('interviews.round_number', 'asc');
      return sendResponse(res, 200, true, 'Application feedback retrieved', feedback);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to retrieve application feedback');
    }
  }
}

export const applicationController = new ApplicationController();
