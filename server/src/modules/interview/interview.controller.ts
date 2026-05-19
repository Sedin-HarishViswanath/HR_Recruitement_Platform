import { Request, Response } from 'express';
import { interviewService } from './interview.service';
import { 
  scheduleInterviewSchema, 
  rescheduleInterviewSchema, 
  feedbackSchema 
} from './interview.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class InterviewController {
  async schedule(req: Request, res: Response) {
    try {
      const parsed = scheduleInterviewSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const interview = await interviewService.scheduleInterview(parsed.data);
      return sendResponse(res, 201, true, 'Interview scheduled successfully', interview);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async listCompanyInterviews(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const result = await interviewService.listCompanyInterviews(companyId, req.query);
      return sendResponse(res, 200, true, 'Interviews retrieved', result);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getInterviewerDashboard(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const stats = await interviewService.getInterviewerDashboard(userId);
      return sendResponse(res, 200, true, 'Interviewer dashboard stats retrieved', stats);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async listInterviewerInterviews(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const interviews = await interviewService.listInterviewerInterviews(userId, req.query);
      return sendResponse(res, 200, true, 'Assigned interviews retrieved', interviews);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async submitFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const parsed = feedbackSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const feedback = await interviewService.submitFeedback(id as string, userId, parsed.data);
      return sendResponse(res, 201, true, 'Feedback submitted successfully', feedback);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async listCompanyFeedback(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const feedbacks = await interviewService.listCompanyFeedback(companyId, req.query);
      return sendResponse(res, 200, true, 'Feedbacks retrieved', feedbacks);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const interview = await interviewService.getInterviewById(id as string);
      if (!interview) throw new AppError('Interview not found', 404);
      return sendResponse(res, 200, true, 'Interview details retrieved', interview);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getMeetingRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user || {};
      const participantName = user.name || user.email || 'Participant';
      const isOwner = ['Admin', 'Recruiter', 'Interviewer'].includes(user.role);
      const room = await interviewService.getMeetingRoom(id as string, participantName, isOwner);
      return sendResponse(res, 200, true, 'Meeting room retrieved', room);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async joinWorkspace(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Validation logic: check if user is candidate or interviewer
      // Return workspace config
      return sendResponse(res, 200, true, 'Join workspace details', { room: `interview_${id}` });
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async executeCode(req: Request, res: Response) {
    try {
      const result = await interviewService.executeCode(req.body);
      return sendResponse(res, 200, true, 'Code executed successfully', result);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 502, false, 'Code execution service is unavailable. Please try again.');
    }
  }

  async submitAptitudeResult(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await interviewService.submitAptitudeResult(id as string, req.body);
      return sendResponse(res, 200, true, 'Aptitude result submitted', result);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to submit aptitude result');
    }
  }

  // ── Transcript endpoints ──

  async saveTranscript(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { entries } = req.body;
      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return sendResponse(res, 400, false, 'entries[] is required');
      }
      const saved = await interviewService.saveTranscriptEntries(id as string, entries);
      return sendResponse(res, 201, true, 'Transcript saved', saved);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to save transcript');
    }
  }

  async getTranscript(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entries = await interviewService.getTranscriptEntries(id as string);
      return sendResponse(res, 200, true, 'Transcript retrieved', entries);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to retrieve transcript');
    }
  }

  async getCandidateTranscripts(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;
      const companyId = req.user.companyId;
      const transcripts = await interviewService.getCandidateTranscripts(candidateId, companyId);
      return sendResponse(res, 200, true, 'Candidate transcripts retrieved', transcripts);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to retrieve candidate transcripts');
    }
  }

  async uploadRecording(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) throw new AppError('No recording file provided', 400);

      const recordingUrl = `/uploads/recordings/${file.filename}`;
      const db = require('../../config/db').db;
      await db('interviews').where({ id }).update({ recording_url: recordingUrl });

      return sendResponse(res, 200, true, 'Recording uploaded', { recordingUrl });
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to upload recording');
    }
  }
}

export const interviewController = new InterviewController();
