import { Router } from 'express';
import { companyController } from './company.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Onboarding endpoints for company admins
router.get('/me/profile', authenticate, companyController.getMyProfile.bind(companyController));
router.patch('/me/profile', authenticate, companyController.updateMyProfile.bind(companyController));

// Super Admin endpoints (prefixed with /admin in the main routes loader if needed, but here we define the relative paths)
// Actually, I'll put admin routes in a separate section or prefix them.
router.get('/admin/list', authenticate, authorize('Super Admin'), companyController.adminListCompanies.bind(companyController));
router.get('/admin/:id', authenticate, authorize('Super Admin'), companyController.adminGetCompany.bind(companyController));
router.patch('/admin/:id/approve', authenticate, authorize('Super Admin'), companyController.adminApproveCompany.bind(companyController));
router.patch('/admin/:id/reject', authenticate, authorize('Super Admin'), companyController.adminRejectCompany.bind(companyController));

export default router;
