import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('Super Admin'));

router.get('/dashboard', adminController.getDashboard.bind(adminController));
router.get('/analytics', adminController.getAnalytics.bind(adminController));
router.get('/users', adminController.listUsers.bind(adminController));

export default router;
