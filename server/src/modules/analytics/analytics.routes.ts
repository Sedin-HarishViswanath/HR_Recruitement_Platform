import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

router.get('/company', authenticate, authorize('Admin', 'Recruiter'), analyticsController.getCompanyAnalytics.bind(analyticsController));
router.get('/company/stats', authenticate, authorize('Admin', 'Recruiter', 'Interviewer'), analyticsController.getCompanyDashboardStats.bind(analyticsController));
router.get('/admin', authenticate, authorize('Super Admin'), analyticsController.getAdminAnalytics.bind(analyticsController));

export default router;
