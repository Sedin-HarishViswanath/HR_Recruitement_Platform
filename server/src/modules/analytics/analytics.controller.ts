import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendResponse } from '../../shared/utils/response';

export class AnalyticsController {
  async getCompanyAnalytics(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const data = await analyticsService.getCompanyAnalytics(companyId, req.query);
      return sendResponse(res, 200, true, 'Company analytics retrieved', data);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Failed to fetch analytics');
    }
  }

  async getCompanyDashboardStats(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const data = await analyticsService.getCompanyDashboardStats(companyId);
      return sendResponse(res, 200, true, 'Company dashboard stats retrieved', data);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Failed to fetch dashboard stats');
    }
  }

  async getAdminAnalytics(req: Request, res: Response) {
    try {
      const data = await analyticsService.getAdminAnalytics();
      return sendResponse(res, 200, true, 'Admin analytics retrieved', data);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Failed to fetch analytics');
    }
  }
}

export const analyticsController = new AnalyticsController();
