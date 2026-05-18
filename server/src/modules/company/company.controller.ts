import { Request, Response } from 'express';
import { companyService } from './company.service';
import { companyProfileSchema } from './company.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class CompanyController {
  async getMyProfile(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      if (!companyId) throw new AppError('No company associated with this user', 400);

      const profile = await companyService.getCompanyProfile(companyId);
      return sendResponse(res, 200, true, 'Company profile retrieved', profile);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async updateMyProfile(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      if (!companyId) throw new AppError('No company associated with this user', 400);

      const parsed = companyProfileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const updated = await companyService.updateCompanyProfile(companyId, parsed.data);
      return sendResponse(res, 200, true, 'Company profile updated', updated);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  // Admin Actions
  async adminListCompanies(req: Request, res: Response) {
    try {
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');

      const result = await companyService.listCompaniesForAdmin({ status, search, page, limit });
      return sendResponse(res, 200, true, 'Companies retrieved', result);
    } catch (error) {
      console.error('Error in adminListCompanies:', error);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async adminGetCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company = await companyService.getCompanyProfile(id as string);
      return sendResponse(res, 200, true, 'Company details retrieved', company);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async adminApproveCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company = await companyService.approveCompany(id as string);
      return sendResponse(res, 200, true, 'Company approved successfully', company);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async adminRejectCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) return sendResponse(res, 400, false, 'Reason is required for rejection');

      const company = await companyService.rejectCompany(id as string, reason);
      return sendResponse(res, 200, true, 'Company rejected successfully', company);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async adminDeleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await companyService.deleteCompany(id as string);
      return sendResponse(res, 200, true, 'Company deleted successfully');
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getDashboardStats(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      if (!companyId) throw new AppError('No company associated with this user', 400);

      const stats = await companyService.getDashboardStats(companyId);
      return sendResponse(res, 200, true, 'Dashboard stats retrieved', stats);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  // User Management
  async listUsers(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { role, search } = req.query;
      const users = await companyService.listCompanyUsers(companyId!, { role: role as string, search: search as string });
      return sendResponse(res, 200, true, 'Users retrieved', users);
    } catch (error) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { userId } = req.params;
      await companyService.updateCompanyUser(companyId!, userId as string, req.body);
      return sendResponse(res, 200, true, 'User updated successfully');
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async deactivateUser(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { userId } = req.params;
      await companyService.deactivateCompanyUser(companyId!, userId as string);
      return sendResponse(res, 200, true, 'User deactivated successfully');
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async inviteUser(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const user = await companyService.inviteUser(companyId!, req.body);
      return sendResponse(res, 201, true, 'User invited successfully', user);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }
}

export const companyController = new CompanyController();
