import { Router } from 'express';
import multer from 'multer';
import { candidateController } from './candidate.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Resume uploads are held in memory, then persisted to object storage (MinIO)
// via the storage service — the buffer is also used directly for AI parsing.
const upload = multer({
  storage: multer.memoryStorage(),
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
