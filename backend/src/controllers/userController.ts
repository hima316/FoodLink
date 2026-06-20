import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import {
  sendSuccess, sendError, sendNotFound,
  buildPagination, parsePaginationParams,
} from '../utils/response';
import { geocodeAddress } from '../utils/geocode';
import logger from '../config/logger';

// ==========================================
// GET /api/v1/users/profile
// ==========================================
export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) { sendNotFound(res, 'User'); return; }
    sendSuccess(res, 'Profile retrieved.', { user });
  } catch (error) {
    logger.error('Get profile error:', error);
    sendError(res, 'Failed to retrieve profile.', 500);
  }
};

// ==========================================
// PATCH /api/v1/users/profile
// Auto-geocodes address → saves real coordinates
// ==========================================
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const allowedFields = [
      'name', 'phone', 'address', 'bio',
      'organizationName', 'organizationType', 'location', 'avatar',
    ];

    const updates: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // ── Auto-geocode address → real coordinates ──────────────────
    // Triggered whenever the user saves an address in Settings.
    // Skipped if they already provided valid non-zero coordinates
    // (e.g. from a future map-picker on the settings page).
    if (req.body.address) {
      const sentLocation = req.body.location;
      const hasValidPin  =
        Array.isArray(sentLocation?.coordinates) &&
        sentLocation.coordinates.length === 2 &&
        (sentLocation.coordinates[0] !== 0 || sentLocation.coordinates[1] !== 0);

      if (!hasValidPin) {
        try {
          const geocoded = await geocodeAddress(req.body.address);
          if (geocoded) {
            updates.location = {
              type:        'Point',
              coordinates: [geocoded.lng, geocoded.lat], // MongoDB: [lng, lat]
            };
            logger.info(
              `Profile geocoded for user ${req.user!.userId}: ` +
              `[${geocoded.lat.toFixed(5)}, ${geocoded.lng.toFixed(5)}]`
            );
          }
          // If geocoding returns null — silently skip, profile still saves
        } catch (geoErr) {
          // Never block the profile save because of geocoding failure
          logger.warn('Profile geocoding failed (non-blocking):', geoErr);
        }
      }
    }
    // ─────────────────────────────────────────────────────────────

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) { sendNotFound(res, 'User'); return; }

    sendSuccess(res, 'Profile updated successfully.', { user });
  } catch (error) {
    logger.error('Update profile error:', error);
    sendError(res, 'Failed to update profile.', 500);
  }
};

// ==========================================
// GET /api/v1/users  (Admin only)
// ==========================================
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, skip } = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const { role, status, search } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name:             { $regex: search, $options: 'i' } },
        { email:            { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, 'Users retrieved.', { users }, 200,
      buildPagination(page, limit, total));
  } catch (error) {
    logger.error('Get all users error:', error);
    sendError(res, 'Failed to retrieve users.', 500);
  }
};

// ==========================================
// GET /api/v1/users/volunteers
// ==========================================
export const getVolunteers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const volunteers = await User.find({ role: 'volunteer', status: 'active' })
      .select('name avatar phone rating totalPickups location address isVerified')
      .sort({ rating: -1, totalPickups: -1 })
      .lean();

    sendSuccess(res, 'Volunteers retrieved.', { volunteers });
  } catch (error) {
    logger.error('Get volunteers error:', error);
    sendError(res, 'Failed to retrieve volunteers.', 500);
  }
};

// ==========================================
// GET /api/v1/users/ngos
// Returns NGOs with their location for map markers
// ==========================================
export const getNGOs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const ngos = await User.find({ role: 'ngo', status: 'active' })
      .select('name organizationName organizationType avatar rating totalReceived location address isVerified')
      .sort({ totalReceived: -1 })
      .lean();

    sendSuccess(res, 'NGOs retrieved.', { ngos });
  } catch (error) {
    logger.error('Get NGOs error:', error);
    sendError(res, 'Failed to retrieve NGOs.', 500);
  }
};

// ==========================================
// PATCH /api/v1/users/:id/status  (Admin only)
// ==========================================
export const updateUserStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!user) { sendNotFound(res, 'User'); return; }
    sendSuccess(res, `User status updated to ${status}.`, { user });
  } catch (error) {
    logger.error('Update user status error:', error);
    sendError(res, 'Failed to update user status.', 500);
  }
};

// ==========================================
// PATCH /api/v1/users/:id/verify  (Admin only)
// ==========================================
export const verifyUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { isVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: Boolean(isVerified) },
      { new: true }
    );

    if (!user) { sendNotFound(res, 'User'); return; }

    // Notify user when verified
    if (isVerified) {
      const Notification = (await import('../models/Notification')).default;
      await Notification.create({
        recipient: user._id,
        type:      'system_alert',
        title:     '✅ Account Verified!',
        message:   'Your FoodLink account has been verified. You now have a verified badge on your profile.',
      });
    }

    logger.info(`User ${user._id} isVerified → ${isVerified}`);
    sendSuccess(res, `User ${isVerified ? 'verified' : 'unverified'}.`, { user });
  } catch (error) {
    logger.error('Verify user error:', error);
    sendError(res, 'Failed to update verification.', 500);
  }
};