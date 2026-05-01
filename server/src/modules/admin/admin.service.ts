import { db } from '../../config/db';

export class AdminService {
  async getDashboardStats() {
    const [companies, users, jobs, applications] = await Promise.all([
      db('companies').count('id as count').first(),
      db('users').count('id as count').first(),
      db('jobs').count('id as count').first(),
      db('applications').count('id as count').first(),
    ]);

    const pendingApprovals = await db('companies').where({ status: 'pending' }).count('id as count').first();

    return {
      totalCompanies: parseInt(companies?.count as string || '0'),
      totalUsers: parseInt(users?.count as string || '0'),
      totalJobs: parseInt(jobs?.count as string || '0'),
      totalApplications: parseInt(applications?.count as string || '0'),
      pendingApprovals: parseInt(pendingApprovals?.count as string || '0'),
    };
  }

  async getAnalytics() {
    const companiesOverTime = await db('companies')
      .select(db.raw("DATE_TRUNC('month', created_at) as month"))
      .count('id as count')
      .groupBy('month')
      .orderBy('month', 'asc');

    const statusDistribution = await db('companies')
      .select('status')
      .count('id as count')
      .groupBy('status');

    return {
      companiesOverTime,
      statusDistribution,
    };
  }

  async listAllUsers(params: { role?: string; company_id?: string; search?: string }) {
    let query = db('users')
      .leftJoin('memberships', 'users.id', 'memberships.user_id')
      .leftJoin('roles', 'memberships.role_id', 'roles.id')
      .leftJoin('companies', 'users.company_id', 'companies.id')
      .select(
        'users.*', 
        'roles.name as role_name', 
        'companies.name as company_name'
      );

    if (params.role) query = query.where('roles.name', params.role);
    if (params.company_id) query = query.where('users.company_id', params.company_id);
    if (params.search) {
      query = query.where('users.name', 'ilike', `%${params.search}%`).orWhere('users.email', 'ilike', `%${params.search}%`);
    }

    return query.orderBy('users.created_at', 'desc');
  }
}

export const adminService = new AdminService();
