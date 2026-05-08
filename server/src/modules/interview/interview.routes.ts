import { Router } from 'express';
import { interviewController } from './interview.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Recruiter/Admin routes
router.post('/', authenticate, authorize('Admin', 'Recruiter'), interviewController.schedule.bind(interviewController));
router.get('/', authenticate, authorize('Admin', 'Recruiter'), interviewController.listCompanyInterviews.bind(interviewController));
router.get('/feedback', authenticate, authorize('Admin', 'Recruiter'), interviewController.listCompanyFeedback.bind(interviewController));

// Interviewer routes
router.get('/dashboard', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), interviewController.getInterviewerDashboard.bind(interviewController));
router.get('/assigned', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), interviewController.listInterviewerInterviews.bind(interviewController));
router.post('/:id/feedback', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), interviewController.submitFeedback.bind(interviewController));

// Workspace routes (Common)
router.post('/:id/join', authenticate, interviewController.joinWorkspace.bind(interviewController));
router.post('/:id/execute', authenticate, interviewController.executeCode.bind(interviewController));

export default router;
