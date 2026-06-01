import { Request, Response, NextFunction } from 'express';
import { candidateService } from './candidate.service';
import { 
  wizardStep1Schema, 
  wizardStep2Schema, 
  wizardStep3Schema, 
  wizardStep4Schema,
  updateProfileSchema 
} from './candidate.schema';

export class CandidateController {
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const profile = await candidateService.getProfile(candidateId as string);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  updateWizardStep = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const step = parseInt(req.params.step as string);
      let validatedData;

      switch (step) {
        case 1:
          validatedData = wizardStep1Schema.parse(req.body);
          break;
        case 2:
          validatedData = wizardStep2Schema.parse(req.body);
          break;
        case 3:
          validatedData = wizardStep3Schema.parse(req.body);
          break;
        case 4:
          validatedData = wizardStep4Schema.parse(req.body);
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid step' });
      }

      const updated = await candidateService.updateProfileStep(candidateId as string, step, validatedData);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('[WizardStep] Error:', err?.message || err, err?.detail || '');
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await candidateService.updateProfile(candidateId as string, validatedData);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  uploadResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      if (!(req as any).file) {
        return res.status(400).json({ success: false, message: 'No resume file uploaded' });
      }
      
      const resumeUrl = `/uploads/resumes/${(req as any).file.filename}`;
      const updated = await candidateService.uploadResume(
        candidateId as string,
        resumeUrl,
        (req as any).file.path
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  deleteResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const updated = await candidateService.deleteResume(candidateId as string);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const dashboard = await candidateService.getDashboard(candidateId as string);
      res.json({ success: true, data: dashboard });
    } catch (err) {
      next(err);
    }
  };

  getApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const apps = await candidateService.getApplications(candidateId as string, req.query);
      res.json({ success: true, data: apps });
    } catch (err) {
      next(err);
    }
  };

  getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const app = await candidateService.getApplicationById(candidateId as string, req.params.id as string);
      res.json({ success: true, data: app });
    } catch (err) {
      next(err);
    }
  };

  withdrawApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const updated = await candidateService.withdrawApplication(candidateId as string, req.params.id as string);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  getInterviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidateId = req.user?.candidateId || req.user?.userId;
      const interviews = await candidateService.getInterviews(candidateId as string, req.query);
      res.json({ success: true, data: interviews });
    } catch (err) {
      next(err);
    }
  };

  getCompanyCandidates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) return res.status(403).json({ success: false, message: 'Forbidden' });
      
      const candidates = await candidateService.getCompanyCandidates(companyId as string, req.query);
      res.json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  };
}

export const candidateController = new CandidateController();
