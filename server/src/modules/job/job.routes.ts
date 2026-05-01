import { Router } from 'express';
import { jobController } from './job.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';
import { extractUserIfPresent } from '../../shared/middlewares/optional-auth.middleware';

const router = Router();

// Public / Candidate endpoints (Optional auth to check if already applied)
router.get('/public', extractUserIfPresent, jobController.getPublicJobs.bind(jobController));
router.get('/public/:id', extractUserIfPresent, jobController.getPublicJobDetail.bind(jobController));

// Recruiter/Admin Job Management Routes
// Uses standard authentication. The controller extracts req.user.companyId
router.use(authenticate);
router.use(authorize('Admin', 'Recruiter'));

router.post('/', jobController.createJob.bind(jobController));
router.get('/', jobController.getCompanyJobs.bind(jobController));
router.get('/:id', jobController.getJobDetail.bind(jobController));
router.patch('/:id', jobController.updateJob.bind(jobController));
router.patch('/:id/status', jobController.changeJobStatus.bind(jobController));
router.delete('/:id', jobController.deleteJob.bind(jobController));

export default router;
