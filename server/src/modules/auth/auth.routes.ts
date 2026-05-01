import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.post('/signup', authController.signup.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/google', authController.googleOAuth.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

export default router;
