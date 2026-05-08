import { Router } from 'express';
import { applicationController } from './application.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Candidate routes
router.post('/', authenticate, authorize('Candidate'), applicationController.applyToJob.bind(applicationController));

// Company/Recruiter routes
router.get('/', authenticate, authorize('Admin', 'Recruiter'), applicationController.listCompanyApplications.bind(applicationController));
router.post('/bulk-move', authenticate, authorize('Admin', 'Recruiter'), applicationController.bulkMove.bind(applicationController));

router.get('/:id/history', authenticate, authorize('Admin', 'Recruiter'), applicationController.getHistory.bind(applicationController));
router.patch('/:id/stage', authenticate, authorize('Admin', 'Recruiter'), applicationController.updateStage.bind(applicationController));
router.patch('/:id/notes', authenticate, authorize('Admin', 'Recruiter'), applicationController.updateNotes.bind(applicationController));

// Per-job pipeline routes
router.get('/job/:jobId/pipeline', authenticate, authorize('Admin', 'Recruiter'), applicationController.getPipeline.bind(applicationController));
router.get('/job/:jobId/summary', authenticate, authorize('Admin', 'Recruiter'), applicationController.getPipelineSummary.bind(applicationController));

export default router;
