import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { applicationController } from './application.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Configure Multer for resume uploads per application
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, path.join(__dirname, '../../../uploads/resumes/'));
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-app-${req.user?.candidateId || req.user?.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Candidate routes
router.post('/', authenticate, authorize('Candidate'), upload.single('resume'), applicationController.applyToJob.bind(applicationController));

// Company/Recruiter routes
router.get('/', authenticate, authorize('Admin', 'Recruiter'), applicationController.listCompanyApplications.bind(applicationController));
router.post('/bulk-move', authenticate, authorize('Admin', 'Recruiter'), applicationController.bulkMove.bind(applicationController));

router.get('/:id/history', authenticate, authorize('Admin', 'Recruiter'), applicationController.getHistory.bind(applicationController));
router.get('/:id/feedback', authenticate, authorize('Admin', 'Recruiter'), applicationController.getApplicationFeedback.bind(applicationController));
router.patch('/:id/stage', authenticate, authorize('Admin', 'Recruiter'), applicationController.updateStage.bind(applicationController));
router.patch('/:id/notes', authenticate, authorize('Admin', 'Recruiter'), applicationController.updateNotes.bind(applicationController));

// Per-job pipeline routes
router.get('/job/:jobId/pipeline', authenticate, authorize('Admin', 'Recruiter'), applicationController.getPipeline.bind(applicationController));
router.get('/job/:jobId/summary', authenticate, authorize('Admin', 'Recruiter'), applicationController.getPipelineSummary.bind(applicationController));

export default router;
