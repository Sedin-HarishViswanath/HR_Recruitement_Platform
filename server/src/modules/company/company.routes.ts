import { Router } from 'express';
import { companyController } from './company.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Onboarding endpoints for company admins
router.get('/me/profile', authenticate, companyController.getMyProfile.bind(companyController));
router.patch('/me/profile', authenticate, authorize('Admin'), companyController.updateMyProfile.bind(companyController));
router.get('/me/dashboard', authenticate, companyController.getDashboardStats.bind(companyController));

// User Management for companies
router.get('/me/users', authenticate, authorize('Admin', 'Recruiter'), companyController.listUsers.bind(companyController));
router.post('/me/users/invite', authenticate, authorize('Admin'), companyController.inviteUser.bind(companyController));
router.patch('/me/users/:userId', authenticate, authorize('Admin'), companyController.updateUser.bind(companyController));
router.patch('/me/users/:userId/deactivate', authenticate, authorize('Admin'), companyController.deactivateUser.bind(companyController));
router.delete('/me/users/:userId', authenticate, authorize('Admin'), companyController.deleteUser.bind(companyController));

import { candidateController } from '../candidate/candidate.controller';
import { interviewController } from '../interview/interview.controller';
router.get('/me/candidates', authenticate, authorize('Admin', 'Recruiter'), candidateController.getCompanyCandidates.bind(candidateController));
router.get('/me/candidates/:candidateId/transcripts', authenticate, authorize('Admin', 'Recruiter'), interviewController.getCandidateTranscripts.bind(interviewController));

// Super Admin endpoints (prefixed with /admin in the main routes loader if needed, but here we define the relative paths)
// Actually, I'll put admin routes in a separate section or prefix them.
router.get('/admin/list', authenticate, authorize('Super Admin'), companyController.adminListCompanies.bind(companyController));
router.get('/admin/:id', authenticate, authorize('Super Admin'), companyController.adminGetCompany.bind(companyController));
router.patch('/admin/:id/approve', authenticate, authorize('Super Admin'), companyController.adminApproveCompany.bind(companyController));
router.patch('/admin/:id/reject', authenticate, authorize('Super Admin'), companyController.adminRejectCompany.bind(companyController));
router.patch('/admin/:id/revoke', authenticate, authorize('Super Admin'), companyController.adminRevokeCompany.bind(companyController));

export default router;
