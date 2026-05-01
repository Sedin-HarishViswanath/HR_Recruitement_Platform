import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

// Role hierarchy defining access levels
const roleHierarchy: Record<string, number> = {
  'Super Admin': 50,
  'Admin': 40,
  'Recruiter': 30,
  'Hiring Manager': 20,
  'Interviewer': 10,
  'Candidate': 0,
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Not authenticated');
    }

    const userRole = req.user.role;

    // Super Admin can access everything
    if (userRole === 'Super Admin') {
      return next();
    }

    // Direct match check
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Optional: Hierarchy check if strict exact matching is not required
    // Let's stick to explicit allowed roles for finer control as requested.
    
    return sendResponse(res, 403, false, 'Access forbidden. Insufficient permissions.');
  };
};

export const authorizeCompanyScoped = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Not authenticated');
    }

    if (req.user.role === 'Super Admin') {
      return next();
    }

    const resourceCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

    if (!resourceCompanyId) {
       // If no company context is provided in the request, proceed.
       // The controller should handle generic scoping (e.g., fetching only req.user.companyId records)
       return next();
    }

    if (req.user.companyId !== String(resourceCompanyId)) {
      return sendResponse(res, 403, false, 'Access forbidden. Cross-company access denied.');
    }

    next();
  };
};
