import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { candidateController } from './candidate.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Configure Multer for resume uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, path.join(__dirname, '../../../uploads/resumes/'));
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${req.user?.candidateId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Candidate routes (require Candidate role)
router.use(authenticate);

// Company-side endpoints are registered elsewhere, these are candidate-only
router.use(authorize('Candidate'));

router.get('/profile', candidateController.getProfile);
router.patch('/profile/step/:step', candidateController.updateWizardStep);
router.patch('/me/profile', candidateController.updateProfile);

router.post('/me/resume', upload.single('resume'), candidateController.uploadResume);
router.delete('/me/resume', candidateController.deleteResume);

router.get('/dashboard', candidateController.getDashboard);
router.get('/applications', candidateController.getApplications);
router.get('/applications/:id', candidateController.getApplicationById);
router.patch('/applications/:id/withdraw', candidateController.withdrawApplication);
router.get('/interviews', candidateController.getInterviews);

export default router;
