import { Router } from 'express';
import { practiceController } from './practice.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All practice routes require authentication
router.post('/chat', authenticate, (req, res) => practiceController.chat(req, res));

export default router;
