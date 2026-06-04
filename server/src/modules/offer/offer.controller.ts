import { Request, Response } from 'express';
import { db } from '../../config/db';
import { offerService } from './offer.service';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export class OfferController {
  // Company: create an offer for an application
  async createOffer(req: Request, res: Response) {
    try {
      const { application_id, salary, currency, start_date, additional_terms } = req.body;
      if (!application_id || !salary || !start_date) {
        return sendResponse(res, 400, false, 'application_id, salary, and start_date are required');
      }

      // Verify the application belongs to this company
      const app = await db('applications')
        .join('jobs', 'applications.job_id', 'jobs.id')
        .where('applications.id', application_id)
        .where('jobs.company_id', req.user.companyId)
        .select('applications.id')
        .first();
      if (!app) throw new AppError('Application not found', 404);

      const offer = await offerService.createOffer(application_id, { salary, currency, start_date, additional_terms });
      return sendResponse(res, 201, true, 'Offer created successfully', offer);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to create offer');
    }
  }

  // Company: get offer for an application
  async getOffer(req: Request, res: Response) {
    try {
      const { applicationId } = req.params;
      const offer = await offerService.getOfferByApplicationId(applicationId as string);
      if (!offer) throw new AppError('No offer found for this application', 404);
      return sendResponse(res, 200, true, 'Offer retrieved', offer);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to retrieve offer');
    }
  }

  // Candidate: get all their offers
  async getCandidateOffers(req: Request, res: Response) {
    try {
      const candidateId = req.user.candidateId || req.user.userId;
      const offers = await db('offers')
        .select(
          'offers.*',
          'jobs.title as job_title',
          'companies.name as company_name',
          'applications.id as application_id',
          'applications.status as application_status',
        )
        .join('applications', 'offers.application_id', 'applications.id')
        .join('jobs', 'applications.job_id', 'jobs.id')
        .join('companies', 'jobs.company_id', 'companies.id')
        .where('applications.candidate_id', candidateId)
        .orderBy('offers.created_at', 'desc');

      return sendResponse(res, 200, true, 'Offers retrieved', offers);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Failed to retrieve offers');
    }
  }

  // Candidate: accept or decline an offer
  async respondToOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { action } = req.body; // 'accepted' | 'declined'
      const candidateId = req.user.candidateId || req.user.userId;

      if (!['accepted', 'declined'].includes(action)) {
        return sendResponse(res, 400, false, "action must be 'accepted' or 'declined'");
      }

      // Verify this offer belongs to the candidate
      const offer = await db('offers')
        .join('applications', 'offers.application_id', 'applications.id')
        .where('offers.id', offerId)
        .where('applications.candidate_id', candidateId)
        .select('offers.*')
        .first();

      if (!offer) throw new AppError('Offer not found', 404);
      if (offer.status !== 'pending') throw new AppError('This offer has already been responded to', 400);

      const updated = await offerService.updateOfferStatus(offerId as string, action);
      return sendResponse(res, 200, true, `Offer ${action} successfully`, updated);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Failed to update offer');
    }
  }
}

export const offerController = new OfferController();
