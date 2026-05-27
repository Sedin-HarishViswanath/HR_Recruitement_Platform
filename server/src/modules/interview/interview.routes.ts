import { Router } from 'express';
import { interviewController } from './interview.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Recruiter/Admin routes
router.post('/', authenticate, authorize('Admin', 'Recruiter'), interviewController.schedule.bind(interviewController));
router.get('/', authenticate, authorize('Admin', 'Recruiter'), interviewController.listCompanyInterviews.bind(interviewController));
router.get('/feedback', authenticate, authorize('Admin', 'Recruiter'), interviewController.listCompanyFeedback.bind(interviewController));

// Interviewer routes
router.get('/dashboard', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), interviewController.getInterviewerDashboard.bind(interviewController));
router.get('/assigned', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), interviewController.listInterviewerInterviews.bind(interviewController));
router.post('/:id/feedback', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), interviewController.submitFeedback.bind(interviewController));
router.get('/:id/meeting-room', authenticate, interviewController.getMeetingRoom.bind(interviewController));
router.post('/:id/aptitude-result', authenticate, authorize('Candidate'), interviewController.submitAptitudeResult.bind(interviewController));

// Reschedule routes
router.get('/reschedule-requests', authenticate, authorize('Admin', 'Recruiter'), interviewController.listRescheduleRequests.bind(interviewController));
router.patch('/reschedule-requests/:id', authenticate, authorize('Admin', 'Recruiter'), interviewController.handleRescheduleRequest.bind(interviewController));
router.post('/:id/reschedule-request', authenticate, authorize('Candidate'), interviewController.requestReschedule.bind(interviewController));

// Transcript routes

// Ensure recordings directory exists
const recordingsDir = path.join(__dirname, '../../../uploads/recordings/');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, recordingsDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recording-${req.params.id}-${uniqueSuffix}.webm`);
  }
});
const upload = multer({ storage });

router.post('/:id/transcript', authenticate, interviewController.saveTranscript.bind(interviewController));
router.get('/:id/transcript', authenticate, authorize('Admin', 'Recruiter'), interviewController.getTranscript.bind(interviewController));

router.post('/:id/recording', authenticate, authorize('Interviewer', 'Recruiter', 'Admin'), upload.single('recording'), interviewController.uploadRecording.bind(interviewController));

router.get('/:id', authenticate, interviewController.getById.bind(interviewController));

// Workspace routes (Common)

router.post('/:id/execute', authenticate, interviewController.executeCode.bind(interviewController));

export default router;
