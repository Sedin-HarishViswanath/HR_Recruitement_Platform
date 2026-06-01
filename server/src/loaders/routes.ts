import { Application, Request, Response } from 'express';
import { sendResponse } from '../shared/utils/response';
import interviewRoutes from '../modules/interview/interview.routes';
import authRoutes from '../modules/auth/auth.routes';
import companyRoutes from '../modules/company/company.routes';
import adminRoutes from '../modules/admin/admin.routes';
import jobRoutes from '../modules/job/job.routes';
import applicationRoutes from '../modules/application/application.routes';
import candidateRoutes from '../modules/candidate/candidate.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import practiceRoutes from '../modules/practice/practice.routes';

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
  app.use('/api/applications', applicationRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/candidate', candidateRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/practice', practiceRoutes);

  // Future modules will be registered here
};
