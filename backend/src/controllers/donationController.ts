import { Response } from 'express';
import mongoose from 'mongoose';
import Donation from '../models/Donation';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';
import {
  sendSuccess, sendError, sendBadRequest,
  sendNotFound, sendConflict, sendForbidden,
  buildPagination, parsePaginationParams,
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
    if (error instanceof mongoose.Error.CastError) {
      sendBadRequest(res, `Invalid ID format: ${error.value}`);
      return;
    }
    logger.error('Get donation error:', error);
    sendError(res, 'Failed to retrieve donation.', 500);
  }
};

// ==========================================
// PATCH /api/v1/donations/:id/claim
// ==========================================
export const claimDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ngoId = req.user!.userId;
    const now = new Date();

    // Atomic conditional update: only update if status is 'available' and not expired
    const updated = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'available',
        expiryTime: { $gt: now },
      },
      {
        $set: {
          status: 'claimed',
          claimedBy: ngoId,
          claimedAt: now,
        },
      },
      { new: true }
    ).populate('donor', 'name organizationName');

    if (!updated) {
      // Diagnostic lookup to return precise error code & message
      const existing = await Donation.findById(req.params.id);
      if (!existing) {
        sendNotFound(res, 'Donation');
        return;
      }
      if (existing.status !== 'available') {
        sendConflict(res, `Donation is already ${existing.status}.`);
        return;
      }
      if (existing.expiryTime <= now) {
        if (existing.status === 'available') {
          await Donation.findByIdAndUpdate(req.params.id, { status: 'expired' }).catch(() => {});
        }
        sendConflict(res, 'Donation has already expired.');
        return;
      }
      sendConflict(res, 'Could not claim donation due to a concurrent conflict.');
      return;
    }

    // Only the single winning request reaches here
    try {
      await User.findByIdAndUpdate(ngoId, { $inc: { totalReceived: 1 } });
    } catch (userErr) {
      logger.error(`Failed to increment totalReceived for NGO ${ngoId}:`, userErr);
    }

    try {
      await Notification.create({
        recipient: updated.donor?._id || updated.donor,
        sender: ngoId,
        type: 'donation_claimed',
        title: '✅ Your donation has been claimed!',
        message: `An NGO has claimed: "${updated.title}"`,
        data: { donationId: updated._id },
      });
    } catch (notifErr) {
      logger.error(`Failed to create claim notification for donation ${updated._id}:`, notifErr);
    }

    logger.info(`Donation ${updated._id} claimed by NGO ${ngoId}`);
    sendSuccess(res, 'Donation claimed!', { donation: updated });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      sendBadRequest(res, `Invalid ID format: ${error.value}`);
      return;
    }
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
    if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
      sendBadRequest(res, 'Invalid volunteer ID format.');
      return;
    }

    const volunteer = await User.findOne({ _id: volunteerId, role: 'volunteer', status: 'active' });
    if (!volunteer) { sendBadRequest(res, 'Volunteer not found or not active.'); return; }

    const filter: Record<string, unknown> = {
      _id: req.params.id,
      status: 'claimed',
    };
    if (req.user!.role !== 'admin') {
      filter.claimedBy = req.user!.userId;
    }

    const now = new Date();
    const updated = await Donation.findOneAndUpdate(
      filter,
      {
        $set: {
          volunteer: volunteerId,
          status: 'in_transit',
          pickedUpAt: now,
        },
      },
      { new: true }
    )
      .populate('donor',     'name organizationName')
      .populate('claimedBy', 'name organizationName')
      .populate('volunteer', 'name phone avatar');

    if (!updated) {
      const existing = await Donation.findById(req.params.id);
      if (!existing) { sendNotFound(res, 'Donation'); return; }
      if (req.user!.role !== 'admin' && existing.claimedBy?.toString() !== req.user!.userId) {
        sendForbidden(res, 'You can only assign volunteers to your own claimed donations.');
        return;
      }
      if (existing.status !== 'claimed') {
        sendConflict(res, `Cannot assign — donation is currently "${existing.status}".`);
        return;
      }
      sendConflict(res, 'Failed to assign volunteer due to a concurrent conflict.');
      return;
    }

    try {
      await Notification.create({
        recipient: volunteerId,
        sender: req.user!.userId,
        type: 'volunteer_assigned',
        title: '🚗 New pickup assignment!',
        message: `You have been assigned to pick up: "${updated.title}"`,
        data: { donationId: updated._id },
      });
      await Notification.create({
        recipient: updated.donor?._id || updated.donor,
        sender: req.user!.userId,
        type: 'donation_picked_up',
        title: '🚗 A volunteer is on the way!',
        message: `A volunteer is collecting: "${updated.title}"`,
        data: { donationId: updated._id },
      });
    } catch (notifErr) {
      logger.error('Assign volunteer notification error:', notifErr);
    }

    logger.info(`Volunteer ${volunteerId} assigned to donation ${updated._id}`);
    sendSuccess(res, 'Volunteer assigned!', { donation: updated });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      sendBadRequest(res, `Invalid ID format: ${error.value}`);
      return;
    }
    logger.error('Assign volunteer error:', error);
    sendError(res, 'Failed to assign volunteer.', 500);
  }
};

// ==========================================
// PATCH /api/v1/donations/:id/deliver
// ==========================================
export const markDelivered = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {
      _id: req.params.id,
      status: 'in_transit',
    };
    if (req.user!.role !== 'admin') {
      filter.volunteer = req.user!.userId;
    }

    const now = new Date();
    const updated = await Donation.findOneAndUpdate(
      filter,
      {
        $set: {
          status: 'delivered',
          deliveredAt: now,
        },
      },
      { new: true }
    );

    if (!updated) {
      const existing = await Donation.findById(req.params.id);
      if (!existing) { sendNotFound(res, 'Donation'); return; }
      if (req.user!.role !== 'admin' && existing.volunteer?.toString() !== req.user!.userId) {
        sendForbidden(res, 'You can only mark donations assigned to you as delivered.');
        return;
      }
      if (existing.status === 'delivered') {
        sendConflict(res, 'Donation is already marked as delivered.');
        return;
      }
      sendConflict(res, `Cannot mark delivered: donation is currently "${existing.status}".`);
      return;
    }

    // Only the single winning request increments the volunteer counter
    if (updated.volunteer) {
      try {
        await User.findByIdAndUpdate(updated.volunteer, { $inc: { totalPickups: 1 } });
      } catch (userErr) {
        logger.error(`Failed to increment totalPickups for volunteer ${updated.volunteer}:`, userErr);
      }
    }

    try {
      if (updated.claimedBy) {
        await Notification.create({
          recipient: updated.claimedBy,
          sender: req.user!.userId,
          type: 'donation_delivered',
          title: '🎉 Donation Delivered!',
          message: `Donation "${updated.title}" has been delivered successfully.`,
          data: { donationId: updated._id },
        });
      }
    } catch (notifErr) {
      logger.error('Mark delivered notification error:', notifErr);
    }

    sendSuccess(res, 'Donation marked as delivered!', { donation: updated });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      sendBadRequest(res, `Invalid ID format: ${error.value}`);
      return;
    }
    logger.error('Mark delivered error:', error);
    sendError(res, 'Failed to mark delivered.', 500);
  }
};

// ==========================================
// DELETE /api/v1/donations/:id
// ==========================================
export const deleteDonation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {
      _id: req.params.id,
      status: { $in: ['available', 'claimed'] },
    };
    if (req.user!.role !== 'admin') {
      filter.donor = req.user!.userId;
    }

    const updated = await Donation.findOneAndUpdate(
      filter,
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!updated) {
      const existing = await Donation.findById(req.params.id);
      if (!existing) { sendNotFound(res, 'Donation'); return; }
      if (req.user!.role !== 'admin' && existing.donor?.toString() !== req.user!.userId) {
        sendForbidden(res, 'Not authorized to cancel this donation.');
        return;
      }
      if (['in_transit', 'delivered'].includes(existing.status)) {
        sendConflict(res, `Cannot cancel donation in "${existing.status}" status.`);
        return;
      }
      if (existing.status === 'cancelled') {
        sendConflict(res, 'Donation is already cancelled.');
        return;
      }
      sendConflict(res, `Cannot cancel donation: donation is currently "${existing.status}".`);
      return;
    }

    // If it was already claimed when cancelled, safely compensate the NGO's counter and send alert
    if (updated.claimedBy) {
      try {
        await User.findOneAndUpdate(
          { _id: updated.claimedBy, totalReceived: { $gt: 0 } },
          { $inc: { totalReceived: -1 } }
        );
        await Notification.create({
          recipient: updated.claimedBy,
          sender: req.user!.userId,
          type: 'system_alert',
          title: '⚠️ Claimed Donation Cancelled',
          message: `The donor cancelled: "${updated.title}"`,
          data: { donationId: updated._id },
        });
      } catch (err) {
        logger.error(`Error compensating NGO for cancelled donation ${updated._id}:`, err);
      }
    }

    logger.info(`Donation ${updated._id} cancelled by ${req.user!.userId}`);
    sendSuccess(res, 'Donation cancelled.');
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      sendBadRequest(res, `Invalid ID format: ${error.value}`);
      return;
    }
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

    const filter: Record<string, unknown> = {
      _id: req.params.id,
      status: 'delivered',
      volunteer: { $exists: true, $ne: null },
      $or: [{ ngoRating: { $exists: false } }, { ngoRating: null }],
    };
    if (req.user!.role !== 'admin') {
      filter.claimedBy = req.user!.userId;
    }

    const updated = await Donation.findOneAndUpdate(
      filter,
      {
        $set: {
          ngoRating: rating,
          ngoFeedback: feedback || '',
          ratedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      const existing = await Donation.findById(req.params.id);
      if (!existing) { sendNotFound(res, 'Donation'); return; }
      if (req.user!.role !== 'admin' && existing.claimedBy?.toString() !== req.user!.userId) {
        sendForbidden(res, 'Only the claiming NGO can rate.');
        return;
      }
      if (existing.status !== 'delivered') {
        sendConflict(res, 'Can only rate after delivery.');
        return;
      }
      if (!existing.volunteer) {
        sendBadRequest(res, 'No volunteer assigned.');
        return;
      }
      if (existing.ngoRating) {
        sendConflict(res, 'Already rated.');
        return;
      }
      sendConflict(res, 'Failed to submit rating due to a conflict.');
      return;
    }

    try {
      const ratedDonations = await Donation.find({
        volunteer: updated.volunteer,
        status: 'delivered',
        ngoRating: { $exists: true, $ne: null },
      }).select('ngoRating');

      if (ratedDonations.length > 0) {
        const avg = Math.round(
          (ratedDonations.reduce((s, d) => s + (d.ngoRating || 0), 0) / ratedDonations.length) * 10
        ) / 10;
        await User.findByIdAndUpdate(updated.volunteer, { rating: avg });
        logger.info(`Volunteer ${updated.volunteer} new avg rating: ${avg}`);
      }
    } catch (err) {
      logger.error('Error updating volunteer average rating:', err);
    }

    sendSuccess(res, 'Volunteer rated successfully!', { rating, feedback });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      sendBadRequest(res, `Invalid ID format: ${error.value}`);
      return;
    }
    logger.error('Rate volunteer error:', error);
    sendError(res, 'Failed to submit rating.', 500);
  }
};

