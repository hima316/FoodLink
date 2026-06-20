import { Router } from 'express';
import {
  createDonation,
  getDonations,
  getDonationById,
  claimDonation,
  assignVolunteer,
  markDelivered,
  deleteDonation,
} from '../controllers/donationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All donation routes require authentication
router.use(authenticate);

// GET all donations (available to all authenticated users)
router.get('/', getDonations);

// GET single donation
router.get('/:id', getDonationById);

// POST create donation (hotels only)
router.post('/', authorize('hotel', 'admin'), createDonation);

// PATCH claim donation (NGOs only)
router.patch('/:id/claim', authorize('ngo'), claimDonation);

// PATCH assign volunteer (NGOs and admins)
router.patch('/:id/assign-volunteer', authorize('ngo', 'admin'), assignVolunteer);

// PATCH mark delivered (volunteers and admins)
router.patch('/:id/deliver', authorize('volunteer', 'admin'), markDelivered);

// DELETE cancel donation (hotel owner or admin)
router.delete('/:id', authorize('hotel', 'admin'), deleteDonation);

export default router;
