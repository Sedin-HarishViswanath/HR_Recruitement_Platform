import { Request, Response } from 'express';
import { authService } from './auth.service';
import { signupSchema, loginSchema } from './auth.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';
import { googleOAuthService } from './google-oauth.service';
import { recoveryService } from './recovery.service';
import { otpService } from './otp.service';

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      console.log('Signup Request Body:', JSON.stringify(req.body, null, 2));
      const parsedBody = signupSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        console.warn('Signup Validation Failed:', JSON.stringify(parsedBody.error.flatten().fieldErrors, null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsedBody.error.flatten().fieldErrors,
        });
      }

      const result = await authService.signup(parsedBody.data);
      
      // Auto-login after signup for immediate onboarding
      const loginResult = await authService.login({
        email: parsedBody.data.email,
        password: parsedBody.data.password
      });

      // Send OTP for email verification
      const isCandidate = parsedBody.data.role === 'candidate';
      void otpService.sendOtp(parsedBody.data.email, isCandidate);

      res.cookie('refreshToken', loginResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendResponse(res, 201, true, 'User registered successfully.', {
        accessToken: loginResult.accessToken,
        user: loginResult.user,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      console.error('Signup Error:', error);
      return sendResponse(res, 500, false, 'Internal server error during signup');
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsedBody = loginSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsedBody.error.flatten().fieldErrors,
        });
      }

      const result = await authService.login(parsedBody.data);
      
      // Optionally, set refreshToken in an httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendResponse(res, 200, true, 'Login successful', {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      console.error('Login Error:', error);
      return sendResponse(res, 500, false, 'Internal server error during login');
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      // Get token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return sendResponse(res, 401, false, 'No refresh token provided');
      }

      const result = await authService.refresh(refreshToken);
      return sendResponse(res, 200, true, 'Token refreshed successfully', result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      console.error('Refresh Error:', error);
      return sendResponse(res, 401, false, 'Invalid refresh token');
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return sendResponse(res, 200, true, 'Logged out successfully');
    } catch (error: any) {
      console.error('Logout Error:', error);
      return sendResponse(res, 500, false, 'Internal server error during logout');
    }
  }
  async googleOAuth(req: Request, res: Response) {
    try {
      const { idToken, role } = req.body;
      if (!idToken || !role) {
        return sendResponse(res, 400, false, 'idToken and role are required');
      }

      const result = await googleOAuthService.handleGoogleLogin(idToken, role);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendResponse(res, 200, true, 'Google login successful', {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      console.error('Google OAuth Error:', error);
      return sendResponse(res, 500, false, 'Internal server error during Google login');
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const token = req.query.token as string;
      if (!token) return sendResponse(res, 400, false, 'Token is required');

      await recoveryService.verifyEmail(token);
      return sendResponse(res, 200, true, 'Email verified successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      return sendResponse(res, 500, false, 'Internal server error during email verification');
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return sendResponse(res, 400, false, 'Email is required');

      // Always return success to prevent email enumeration
      await recoveryService.sendPasswordResetEmail(email);
      return sendResponse(res, 200, true, 'If that email exists, a reset link has been sent');
    } catch (error) {
      console.error('Forgot Password Error:', error);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password, confirmPassword } = req.body;
      if (!token || !password || !confirmPassword) {
        return sendResponse(res, 400, false, 'Token, password, and confirmPassword are required');
      }
      if (password !== confirmPassword) {
        return sendResponse(res, 400, false, 'Passwords do not match');
      }
      
      // Simple validation here, can be enhanced with Zod
      if (password.length < 8) {
        return sendResponse(res, 400, false, 'Password must be at least 8 characters');
      }

      await recoveryService.resetPassword(token, password);
      return sendResponse(res, 200, true, 'Password reset successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      return sendResponse(res, 500, false, 'Internal server error during password reset');
    }
  }
  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return sendResponse(res, 400, false, 'Email and OTP are required');

      await otpService.verifyOtp(email.toLowerCase(), otp);
      return sendResponse(res, 200, true, 'Email verified successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      return sendResponse(res, 500, false, 'Verification failed');
    }
  }

  async resendOtp(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return sendResponse(res, 400, false, 'Email is required');

      await otpService.resendOtp(email.toLowerCase());
      return sendResponse(res, 200, true, 'New verification code sent');
    } catch (error: any) {
      if (error instanceof AppError) {
        return sendResponse(res, error.statusCode, false, error.message);
      }
      return sendResponse(res, 500, false, 'Failed to resend OTP');
    }
  }
}

export const authController = new AuthController();
