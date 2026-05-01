import { Application, Request, Response } from 'express';
import { sendResponse } from '../shared/utils/response';
import interviewRoutes from '../modules/interview/interview.routes';
import authRoutes from '../modules/auth/auth.routes';

export default (app: Application) => {
  app.get('/api/health', (req: Request, res: Response) => {
    sendResponse(res, 200, true, 'API is running', {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
};
