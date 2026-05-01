import { Router } from 'express';
import { applicationController } from './application.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, authorize('Candidate'), applicationController.applyToJob.bind(applicationController));

export default router;
