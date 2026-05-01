import { Application, Request, Response } from 'express';
import { sendResponse } from '../shared/utils/response';
import interviewRoutes from '../modules/interview/interview.routes';
import authRoutes from '../modules/auth/auth.routes';
import companyRoutes from '../modules/company/company.routes';
import adminRoutes from '../modules/admin/admin.routes';
import jobRoutes from '../modules/job/job.routes';

export default (app: Application) => {
  app.get('/api/health', (req: Request, res: Response) => {
    sendResponse(res, 200, true, 'API is running', {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/code', interviewRoutes);

  // Future modules will be registered here
};
