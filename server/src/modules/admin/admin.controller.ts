import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { sendResponse } from '../../shared/utils/response';

export class AdminController {
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      return sendResponse(res, 200, true, 'Admin dashboard stats retrieved', stats);
    } catch (error) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const analytics = await adminService.getAnalytics();
      return sendResponse(res, 200, true, 'Admin analytics retrieved', analytics);
    } catch (error) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async listUsers(req: Request, res: Response) {
    try {
      const { role, company_id, search } = req.query;
      const users = await adminService.listAllUsers({ 
        role: role as string, 
        company_id: company_id as string, 
        search: search as string 
      });
      return sendResponse(res, 200, true, 'All users retrieved', users);
    } catch (error) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }
}

export const adminController = new AdminController();
