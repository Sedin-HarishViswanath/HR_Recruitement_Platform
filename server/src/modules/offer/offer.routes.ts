import { Router } from 'express';
import { offerController } from './offer.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';

const router = Router();

// Company routes
router.post('/', authenticate, authorize('Admin', 'Recruiter'), offerController.createOffer.bind(offerController));
router.get('/application/:applicationId', authenticate, authorize('Admin', 'Recruiter'), offerController.getOffer.bind(offerController));

// Candidate routes
router.get('/mine', authenticate, authorize('Candidate'), offerController.getCandidateOffers.bind(offerController));
router.patch('/:offerId/respond', authenticate, authorize('Candidate'), offerController.respondToOffer.bind(offerController));

export default router;
