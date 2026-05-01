import { Request, Response } from 'express';
import { authService } from './auth.service';
import { signupSchema, loginSchema } from './auth.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const parsedBody = signupSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsedBody.error.flatten().fieldErrors,
        });
      }

      const result = await authService.signup(parsedBody.data);
      return sendResponse(res, 201, true, 'User registered successfully', result);
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
}

export const authController = new AuthController();
