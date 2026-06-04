import { db } from '../../config/db';
import { CompanyProfileInput } from './company.schema';
import { AppError } from '../../shared/errors/AppError';
import bcrypt from 'bcryptjs';
import { inAppNotificationService } from '../notification/inapp-notification.service';
import { sendEmail } from '../../shared/utils/email';
import { userInviteEmail } from '../../shared/templates/emailTemplates';

export class CompanyService {
  async getCompanyProfile(companyId: string) {
    const company = await db('companies').where({ id: companyId }).first();
    if (!company) throw new AppError('Company not found', 404);
    return company;
  }

  async updateCompanyProfile(companyId: string, data: CompanyProfileInput) {
    const [updatedCompany] = await db('companies')
      .where({ id: companyId })
      .update(data)
      .returning('*');
    
    if (!updatedCompany) throw new AppError('Failed to update company profile', 400);
    return updatedCompany;
  }

  async listCompaniesForAdmin(params: { status?: string; search?: string; page: number; limit: number }) {
    const { status, search, page, limit } = params;
    const offset = (page - 1) * limit;

    // Start with a base query
    const baseQuery = db('companies');

    if (status) {
      baseQuery.where('companies.status', status);
    }

    if (search) {
      baseQuery.where((qb) => {
        qb.where('companies.name', 'ilike', `%${search}%`)
          .orWhere('companies.domain', 'ilike', `%${search}%`);
      });
    }

    // Get total count using a clean clone
    const totalCountResult = await baseQuery.clone().count('id as count').first();
    const totalCount = parseInt(totalCountResult?.count as string || '0');

    // Fetch data with joins to get admin details as expected by the frontend
    const companies = await baseQuery
      .clone()
      .leftJoin('users', 'companies.admin_user_id', 'users.id')
      .select(
        'companies.*',
        'users.name as admin_name',
        'users.email as admin_email'
      )
      .limit(limit)
      .offset(offset)
      .orderBy('companies.created_at', 'desc');

    return {
      companies,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async approveCompany(companyId: string) {
    const [company] = await db('companies')
      .where({ id: companyId })
      .update({ status: 'active', active: true })
      .returning('*');
    
    // Notify the company admin
    if (company?.admin_user_id) {
      await inAppNotificationService.create({
        userId: company.admin_user_id,
        title: '🎉 Company Approved!',
        body: `Your company "${company.name}" has been approved by the Super Admin. You now have full access to the platform.`,
        type: 'success',
        link: '/company/dashboard',
      });
    }
    return company;
  }

  async rejectCompany(companyId: string, reason: string) {
    const [company] = await db('companies')
      .where({ id: companyId })
      .update({ status: 'rejected', active: false })
      .returning('*');
    
    // Notify the company admin
    if (company?.admin_user_id) {
      await inAppNotificationService.create({
        userId: company.admin_user_id,
        title: 'Company Registration Rejected',
        body: reason ? `Your company registration was rejected. Reason: ${reason}` : 'Your company registration was not approved. Please contact support for more information.',
        type: 'error',
        link: '/pending-approval',
      });
    }
    return company;
  }

  async revokeCompany(companyId: string, reason?: string) {
    const [company] = await db('companies')
      .where({ id: companyId })
      .update({ status: 'revoked', active: false })
      .returning('*');
    
    // Notify the company admin
    if (company?.admin_user_id) {
      await inAppNotificationService.create({
        userId: company.admin_user_id,
        title: '⚠️ Company Access Revoked',
        body: reason ? `Your company access has been revoked. Reason: ${reason}` : `Access for your company "${company.name}" has been revoked by the Super Admin.`,
        type: 'error',
        link: '/unauthorized',
      });
    }
    return company;
  }

  async getDashboardStats(companyId: string) {
    const [totalJobs, activeJobs, totalApps, totalHires] = await Promise.all([
      db('jobs').where({ company_id: companyId }).count('id as count').first(),
      db('jobs').where({ company_id: companyId, status: 'published' }).count('id as count').first(),
      db('applications').join('jobs', 'applications.job_id', 'jobs.id').where('jobs.company_id', companyId).count('applications.id as count').first(),
      db('applications').join('jobs', 'applications.job_id', 'jobs.id').where('jobs.company_id', companyId).where('applications.status', 'hired').count('applications.id as count').first(),
    ]);

    const pipelineDistribution = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .select('applications.status')
      .count('applications.id as count')
      .groupBy('applications.status');

    return {
      totalJobs: parseInt(totalJobs?.count as string || '0'),
      activeJobs: parseInt(activeJobs?.count as string || '0'),
      totalApplications: parseInt(totalApps?.count as string || '0'),
      totalHires: parseInt(totalHires?.count as string || '0'),
      pipelineDistribution,
    };
  }

  // User Management
  async listCompanyUsers(companyId: string, params: { role?: string; search?: string }) {
    let query = db('users')
      .join('memberships', 'users.id', 'memberships.user_id')
      .join('roles', 'memberships.role_id', 'roles.id')
      .select('users.*', 'roles.name as role_name')
      .where('users.company_id', companyId);

    if (params.role) {
      query = query.where('roles.name', params.role);
    }

    if (params.search) {
      query = query.where('users.name', 'ilike', `%${params.search}%`).orWhere('users.email', 'ilike', `%${params.search}%`);
    }

    return query.orderBy('users.created_at', 'desc');
  }

  async updateCompanyUser(companyId: string, userId: string, data: { name?: string; role?: string }) {
    await db.transaction(async (trx) => {
      const user = await trx('users').where({ id: userId, company_id: companyId }).first();
      if (!user) throw new AppError('User not found in your company', 404);

      if (data.name) {
        await trx('users').where({ id: userId }).update({ name: data.name });
      }

      if (data.role) {
        const role = await trx('roles').where({ name: data.role }).first();
        if (!role) throw new AppError('Invalid role', 400);
        await trx('memberships').where({ user_id: userId }).update({ role_id: role.id });
      }
    });
  }

  async deactivateCompanyUser(companyId: string, userId: string) {
    const user = await db('users').where({ id: userId, company_id: companyId }).first();
    if (!user) throw new AppError('User not found in your company', 404);
    // Toggle active status
    await db('users').where({ id: userId }).update({ is_active: !user.is_active });
  }

  async inviteUser(companyId: string, data: any) {
    const { name, email, role, password } = data;
    
    const { user, inviteLink, companyName } = await db.transaction(async (trx) => {
      const existing = await trx('users').where({ email }).first();
      if (existing) throw new AppError('Email already registered', 400);

      const company = await trx('companies').where({ id: companyId }).first();
      if (!company) throw new AppError('Company not found', 404);

      const roleRecord = await trx('roles').where({ name: role }).first();
      if (!roleRecord) throw new AppError('Invalid role', 400);

      const hashedPassword = await bcrypt.hash(password, 12);
      const [insertedUser] = await trx('users')
        .insert({
          name,
          email,
          password_digest: hashedPassword,
          company_id: companyId,
          is_verified: true, // Auto-verified since admin created it
        })
        .returning('*');

      await trx('memberships').insert({
        user_id: insertedUser.id,
        role_id: roleRecord.id,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const inviteLink = `${frontendUrl}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

      return { user: insertedUser, inviteLink, companyName: company.name };
    });

    await sendEmail({
      to: email,
      subject: `Invitation to join ${companyName}`,
      html: userInviteEmail(name, role, companyName, inviteLink),
      eventType: 'user_invited',
      entityType: 'company',
      entityId: companyId
    });

    return { ...user, inviteLink };
  }
}

export const companyService = new CompanyService();
