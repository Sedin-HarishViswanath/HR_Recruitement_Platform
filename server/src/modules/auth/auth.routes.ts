import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.post('/signup', authController.signup.bind(authController));
router.post('/login', authController.login.bind(authController));

export default router;
