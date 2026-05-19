import { db } from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { notificationService } from '../notification/notification.service';

export class OfferService {
  async createOffer(applicationId: string, data: any) {
    return await db.transaction(async (trx) => {
      const application = await trx('applications')
        .select('applications.*', 'candidates.email', 'candidates.name', 'jobs.title', 'companies.name as company_name')
        .join('candidates', 'applications.candidate_id', 'candidates.id')
        .join('jobs', 'applications.job_id', 'jobs.id')
        .join('companies', 'jobs.company_id', 'companies.id')
        .where('applications.id', applicationId)
        .first();

      if (!application) throw new AppError('Application not found', 404);

      const [offer] = await trx('offers')
        .insert({
          application_id: applicationId,
          salary: data.salary,
          currency: data.currency || 'USD',
          start_date: data.start_date,
          additional_terms: data.additional_terms,
          status: 'pending'
        })
        .returning('*');

      // Update application status to 'offer'
      await trx('applications').where({ id: applicationId }).update({ status: 'offer' });

      // Notify candidate
      // We'll add a specific notification for offers later if needed
      
      return offer;
    });
  }

  async getOfferByApplicationId(applicationId: string) {
    return db('offers').where({ application_id: applicationId }).first();
  }

  async updateOfferStatus(offerId: string, status: string) {
    const [offer] = await db('offers').where({ id: offerId }).update({ status, updated_at: db.fn.now() }).returning('*');
    
    if (status === 'accepted') {
      await db('applications').where({ id: offer.application_id }).update({ status: 'hired' });
    }
    
    return offer;
  }
}

export const offerService = new OfferService();
