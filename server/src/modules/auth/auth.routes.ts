import { Router } from 'express';
import { authController } from './auth.controller';
import { authLimiter, forgotPasswordLimiter } from '../../shared/middlewares/rate-limiter.middleware';

const router = Router();

router.post('/signup', authLimiter, authController.signup.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/google', authLimiter, authController.googleOAuth.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/verify-otp', authController.verifyOtp.bind(authController));
router.post('/resend-otp', authController.resendOtp.bind(authController));

export default router;
