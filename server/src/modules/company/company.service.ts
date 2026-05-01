import { db } from '../../config/db';
import { CompanyProfileInput } from './company.schema';
import { AppError } from '../../shared/errors/AppError';

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

    let query = db('companies').select('*');

    if (status) {
      query = query.where({ status });
    }

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`).orWhere('domain', 'ilike', `%${search}%`);
    }

    const totalCountResult = await query.clone().count('id as count').first();
    const totalCount = parseInt(totalCountResult?.count as string || '0');

    const companies = await query.limit(limit).offset(offset).orderBy('created_at', 'desc');

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
    
    // TODO: Send approval email
    return company;
  }

  async rejectCompany(companyId: string, reason: string) {
    const [company] = await db('companies')
      .where({ id: companyId })
      .update({ status: 'rejected', active: false })
      .returning('*');
    
    // TODO: Send rejection email with reason
    return company;
  }
}

export const companyService = new CompanyService();
