import { Response } from 'express';
import Donation from '../models/Donation';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';
import {
  sendSuccess, sendError, sendBadRequest,
  sendNotFound, buildPagination, parsePaginationParams,
} from '../utils/response';
import { geocodeAddress } from '../utils/geocode';
import logger from '../config/logger';

// ==========================================
// POST /api/v1/donations
// ==========================================
export const createDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const donorId = req.user!.userId;
    const {
      title, description, category, quantity, unit, servings,
      expiryTime, pickupDeadline, address, location, allergens,
      specialInstructions, temperatureRequirements, isEmergency,
    } = req.body;

    // ── Resolve coordinates ──────────────────────────────────────────
    // Priority 1: map picker sent valid non-zero coords from frontend
    // Priority 2: auto-geocode from address text (Nominatim, free)
    // Priority 3: [0,0] default → marker hidden on map
    let finalLocation = location;

    const sentCoords  = location?.coordinates;
    const hasValidPin =
      Array.isArray(sentCoords) &&
      sentCoords.length === 2 &&
      (sentCoords[0] !== 0 || sentCoords[1] !== 0);

    if (!hasValidPin) {
      try{
      const geocoded = await geocodeAddress(address || {});
      if (geocoded) {
        finalLocation = {
          type:        'Point',
          coordinates: [geocoded.lng, geocoded.lat],
        };
        logger.info(`Geocoded "${address?.city}" → [${geocoded.lat}, ${geocoded.lng}]`);
      }
    } catch (geoErr) {
      logger.warn('Geocoding failed silently:', geoErr);
      }
   }else {
      logger.info(`Map-picker coords used: [${sentCoords[1]}, ${sentCoords[0]}]`);
    }
    // ────────────────────────────────────────────────────────────────

    const donation = await Donation.create({
      donor: donorId,
      title, description, category, quantity, unit, servings,
      expiryTime:     new Date(expiryTime),
      pickupDeadline: new Date(pickupDeadline),
      address,
      location: finalLocation,
      allergens,
      specialInstructions,
      temperatureRequirements,
      isEmergency: isEmergency || false,
    });

    await User.findByIdAndUpdate(donorId, { $inc: { totalDonations: 1 } });

    const ngos = await User.find({ role: 'ngo', status: 'active' }).select('_id');
    const notificationPayload = ngos.map((ngo) => ({
      recipient: ngo._id,
      sender:    donorId,
      type:      isEmergency ? 'emergency_request' : 'donation_available',
      title:     isEmergency ? '🚨 Emergency Donation Available!' : '🍽️ New Donation Available',
      message:   `${title} — ${quantity} ${unit} available for pickup`,
      data:      { donationId: donation._id },
    }));

    if (notificationPayload.length > 0) await Notification.insertMany(notificationPayload);

    logger.info(`New donation: ${donation._id} by ${donorId}`);

    const populated = await Donation.findById(donation._id).populate('donor', 'name organizationName avatar');
    sendSuccess(res, 'Donation created successfully!', { donation: populated }, 201);
  } catch (error) {
    logger.error('Create donation error:', error);
    sendError(res, 'Failed to create donation.', 500);
  }
};

// ==========================================
// GET /api/v1/donations
// ==========================================
export const getDonations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);
    const {
      status, category, isEmergency, city, search,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (category)               filter.category        = category;
    if (isEmergency === 'true') filter.isEmergency     = true;
    if (city)                   filter['address.city'] = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based visibility
    if (req.user?.role === 'hotel') {
      filter.donor = req.user.userId;
    }
    if (req.user?.role === 'ngo' && status && status !== 'available') {
      filter.claimedBy = req.user.userId;
    }
    if (req.user?.role === 'volunteer' && status && ['in_transit','claimed','delivered'].includes(status)) {
      filter.volunteer = req.user.userId;
    }

    // Status + expiry filtering
    if (status === 'expired') {
      filter.status = 'expired';
    } else if (!status) {
      filter.status     = { $ne: 'expired' };
      filter.expiryTime = { $gt: new Date() };
    } else if (status === 'available') {
      filter.status     = 'available';
      filter.expiryTime = { $gt: new Date() };
    } else {
      filter.status = status;
    }

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip).limit(limit)
        .populate('donor',     'name organizationName avatar address')
        .populate('claimedBy', 'name organizationName')
        .populate('volunteer', 'name avatar phone')
        .lean(),
      Donation.countDocuments(filter),
    ]);

    sendSuccess(res, 'Donations retrieved.', { donations }, 200, buildPagination(page, limit, total));
  } catch (error) {
    logger.error('Get donations error:', error);
    sendError(res, 'Failed to retrieve donations.', 500);
  }
};

// ==========================================
// GET /api/v1/donations/:id
// ==========================================
export const getDonationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor',     'name organizationName avatar phone address')
      .populate('claimedBy', 'name organizationName avatar')
      .populate('volunteer', 'name avatar phone');

    if (!donation) { sendNotFound(res, 'Donation'); return; }
    sendSuccess(res, 'Donation retrieved.', { donation });
  } catch (error) {
    logger.error('Get donation error:', error);
    sendError(res, 'Failed to retrieve donation.', 500);
  }
};

// ==========================================
// PATCH /api/v1/donations/:id/claim
// ==========================================
export const claimDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ngoId    = req.user!.userId;
    const donation = await Donation.findById(req.params.id);

    if (!donation)                      { sendNotFound(res, 'Donation'); return; }
    if (donation.status !== 'available') { sendBadRequest(res, `Donation is already ${donation.status}.`); return; }
    if (new Date() > donation.expiryTime) { sendBadRequest(res, 'Donation has already expired.'); return; }

    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: 'claimed', claimedBy: ngoId, claimedAt: new Date() },
      { new: true }
    ).populate('donor', 'name organizationName');

    await User.findByIdAndUpdate(ngoId, { $inc: { totalReceived: 1 } });
    await Notification.create({
      recipient: donation.donor, sender: ngoId,
      type: 'donation_claimed',
      title: '✅ Your donation has been claimed!',
      message: `An NGO has claimed: "${donation.title}"`,
      data: { donationId: donation._id },
    });

    logger.info(`Donation ${donation._id} claimed by NGO ${ngoId}`);
    sendSuccess(res, 'Donation claimed!', { donation: updated });
  } catch (error) {
    logger.error('Claim donation error:', error);
    sendError(res, 'Failed to claim donation.', 500);
  }
};

// ==========================================
// PATCH /api/v1/donations/:id/assign-volunteer
// ==========================================
export const assignVolunteer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { volunteerId } = req.body;
    if (!volunteerId) { sendBadRequest(res, 'Volunteer ID is required.'); return; }

    const donation = await Donation.findById(req.params.id);
    if (!donation) { sendNotFound(res, 'Donation'); return; }

    if (donation.status !== 'claimed') {
      sendBadRequest(res, `Cannot assign — donation is "${donation.status}".`); return;
    }
    if (req.user!.role !== 'admin' && donation.claimedBy?.toString() !== req.user!.userId) {
      sendError(res, 'You can only assign volunteers to your own claimed donations.', 403); return;
    }

    const volunteer = await User.findOne({ _id: volunteerId, role: 'volunteer', status: 'active' });
    if (!volunteer) { sendBadRequest(res, 'Volunteer not found or not active.'); return; }

    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { volunteer: volunteerId, status: 'in_transit', pickedUpAt: new Date() },
      { new: true }
    )
      .populate('donor',     'name organizationName')
      .populate('claimedBy', 'name organizationName')
      .populate('volunteer', 'name phone avatar');

    await Notification.create({
      recipient: volunteerId, sender: req.user!.userId,
      type: 'volunteer_assigned',
      title: '🚗 New pickup assignment!',
      message: `You have been assigned to pick up: "${donation.title}"`,
      data: { donationId: donation._id },
    });
    await Notification.create({
      recipient: donation.donor, sender: req.user!.userId,
      type: 'donation_picked_up',
      title: '🚗 A volunteer is on the way!',
      message: `A volunteer is collecting: "${donation.title}"`,
      data: { donationId: donation._id },
    });

    logger.info(`Volunteer ${volunteerId} assigned to donation ${donation._id}`);
    sendSuccess(res, 'Volunteer assigned!', { donation: updated });
  } catch (error) {
    logger.error('Assign volunteer error:', error);
    sendError(res, 'Failed to assign volunteer.', 500);
  }
};

// ==========================================
// PATCH /api/v1/donations/:id/deliver
// ==========================================
export const markDelivered = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) { sendNotFound(res, 'Donation'); return; }

    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: 'delivered', deliveredAt: new Date() },
      { new: true }
    );

    if (donation.volunteer) {
      await User.findByIdAndUpdate(donation.volunteer, { $inc: { totalPickups: 1 } });
    }
    sendSuccess(res, 'Donation marked as delivered!', { donation: updated });
  } catch (error) {
    logger.error('Mark delivered error:', error);
    sendError(res, 'Failed to mark delivered.', 500);
  }
};

// ==========================================
// DELETE /api/v1/donations/:id
// ==========================================
export const deleteDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) { sendNotFound(res, 'Donation'); return; }

    if (req.user!.role !== 'admin' && donation.donor.toString() !== req.user!.userId) {
      sendError(res, 'Not authorized.', 403); return;
    }
    if (['in_transit', 'delivered'].includes(donation.status)) {
      sendBadRequest(res, 'Cannot cancel a donation in transit or delivered.'); return;
    }

    await Donation.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    sendSuccess(res, 'Donation cancelled.');
  } catch (error) {
    logger.error('Delete donation error:', error);
    sendError(res, 'Failed to delete donation.', 500);
  }
};

// ==========================================
// PATCH /api/v1/donations/:id/rate-volunteer
// ==========================================
export const rateVolunteer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) { sendBadRequest(res, 'Rating must be 1–5.'); return; }

    const donation = await Donation.findById(req.params.id);
    if (!donation)                                            { sendNotFound(res, 'Donation'); return; }
    if (donation.claimedBy?.toString() !== req.user!.userId) { sendError(res, 'Only the claiming NGO can rate.', 403); return; }
    if (donation.status !== 'delivered')                     { sendBadRequest(res, 'Can only rate after delivery.'); return; }
    if (!donation.volunteer)                                  { sendBadRequest(res, 'No volunteer assigned.'); return; }
    if ((donation as unknown as { ngoRating?: number }).ngoRating) { sendBadRequest(res, 'Already rated.'); return; }

    await Donation.findByIdAndUpdate(req.params.id, {
      ngoRating: rating, ngoFeedback: feedback || '', ratedAt: new Date(),
    });

    const ratedDonations = await Donation.find({
      volunteer: donation.volunteer, status: 'delivered',
      ngoRating: { $exists: true, $ne: null },
    }).select('ngoRating');

    if (ratedDonations.length > 0) {
      const avg = Math.round(
        (ratedDonations.reduce((s, d) => s + ((d as unknown as { ngoRating?: number }).ngoRating || 0), 0) / ratedDonations.length) * 10
      ) / 10;
      await User.findByIdAndUpdate(donation.volunteer, { rating: avg });
      logger.info(`Volunteer ${donation.volunteer} new avg rating: ${avg}`);
    }

    sendSuccess(res, 'Volunteer rated successfully!', { rating, feedback });
  } catch (error) {
    logger.error('Rate volunteer error:', error);
    sendError(res, 'Failed to submit rating.', 500);
  }
};
