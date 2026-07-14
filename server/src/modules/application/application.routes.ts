import { Router } from 'express';
import multer from 'multer';
import { applicationController } from './application.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Resume uploads are held in memory, then persisted to object storage (MinIO)
// via the storage service — the buffer is also used directly for AI parsing.
const upload = multer({
  storage: multer.memoryStorage(),
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
router.post('/compare', authenticate, authorize('Admin', 'Recruiter'), applicationController.compareCandidates.bind(applicationController));

router.get('/:id/history', authenticate, authorize('Admin', 'Recruiter'), applicationController.getHistory.bind(applicationController));
router.get('/:id/feedback', authenticate, authorize('Admin', 'Recruiter'), applicationController.getApplicationFeedback.bind(applicationController));
router.patch('/:id/stage', authenticate, authorize('Admin', 'Recruiter'), applicationController.updateStage.bind(applicationController));
router.patch('/:id/notes', authenticate, authorize('Admin', 'Recruiter'), applicationController.updateNotes.bind(applicationController));

// Per-job pipeline routes
router.get('/job/:jobId/pipeline', authenticate, authorize('Admin', 'Recruiter'), applicationController.getPipeline.bind(applicationController));
router.get('/job/:jobId/summary', authenticate, authorize('Admin', 'Recruiter'), applicationController.getPipelineSummary.bind(applicationController));

// Autonomous screening agent routes
router.post('/job/:jobId/screen', authenticate, authorize('Admin', 'Recruiter'), applicationController.startScreen.bind(applicationController));
router.get('/job/:jobId/screen/state', authenticate, authorize('Admin', 'Recruiter'), applicationController.getScreenState.bind(applicationController));

export default router;
