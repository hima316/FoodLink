import { Response } from 'express';
import Donation from '../models/Donation';
import User from '../models/User';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

/**
 * GET /api/v1/analytics/overview
 * Get platform-wide analytics overview
 */
export const getAnalyticsOverview = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      totalDonations,
      activeDonations,
      deliveredDonations,
      totalHotels,
      totalNGOs,
      totalVolunteers,
      deliveredWithServings,
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'available' }),
      Donation.countDocuments({ status: 'delivered' }),
      User.countDocuments({ role: 'hotel', status: 'active' }),
      User.countDocuments({ role: 'ngo', status: 'active' }),
      User.countDocuments({ role: 'volunteer', status: 'active' }),
      Donation.find({ status: 'delivered' }).select('servings quantity').lean(),
    ]);

    const totalMealsSaved = deliveredWithServings.reduce(
      (sum, d) => sum + (d.servings || Math.floor(d.quantity * 4)),
      0
    );

    const totalFoodKg = deliveredWithServings.reduce(
      (sum, d) => sum + d.quantity,
      0
    );

    sendSuccess(res, 'Analytics overview retrieved.', {
      totalDonations,
      activeDonations,
      deliveredDonations,
      totalMealsSaved,
      totalFoodKg: Math.round(totalFoodKg * 10) / 10,
      totalHotels,
      totalNGOs,
      totalVolunteers,
      totalNGOsSupported: totalNGOs,
    });
  } catch (error) {
    logger.error('Analytics overview error:', error);
    sendError(res, 'Failed to retrieve analytics.', 500);
  }
};

/**
 * GET /api/v1/analytics/monthly
 * Get monthly donation stats for charts
 */
export const getMonthlyStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const stats = await Donation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          donations: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          totalServings: { $sum: { $ifNull: ['$servings', 0] } },
          totalKg: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const formatted = stats.map((s) => ({
      month: `${months[s._id.month - 1]} ${s._id.year}`,
      donations: s.donations,
      delivered: s.delivered,
      meals: s.totalServings,
      foodKg: Math.round(s.totalKg * 10) / 10,
    }));

    sendSuccess(res, 'Monthly stats retrieved.', { stats: formatted });
  } catch (error) {
    logger.error('Monthly stats error:', error);
    sendError(res, 'Failed to retrieve monthly stats.', 500);
  }
};

/**
 * GET /api/v1/analytics/my-stats
 * Role-specific stats for the current user
 */
export const getMyStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let stats = {};

    if (role === 'hotel') {
      const [total, active, delivered, claimed] = await Promise.all([
       Donation.countDocuments({
        donor: userId,
        status: { $nin: ['expired', 'cancelled'] },
       }),
    // Active = available RIGHT NOW (not expired yet)
       Donation.countDocuments({
        donor: userId,
        status: 'available',
        expiryTime: { $gt: new Date() },
       }),
       Donation.countDocuments({ donor: userId, status: 'delivered' }),
    // Claimed includes both claimed and in_transit
       Donation.countDocuments({
        donor: userId,
        status: { $in: ['claimed', 'in_transit'] },
       }),
      ]);
      const deliveredData = await Donation.find({
        donor: userId,
        status: 'delivered',
      }).select('servings quantity');
      const mealsSaved = deliveredData.reduce(
        (sum, d) => sum + (d.servings || Math.floor(d.quantity * 4)),
        0
      );
      stats = { total, active, delivered, claimed, mealsSaved };
    } else if (role === 'ngo') {
      const [total, active, delivered] = await Promise.all([
         Donation.countDocuments({ claimedBy: userId }),
    // Count both 'claimed' (awaiting volunteer) AND 'in_transit' (pickup in progress)
         Donation.countDocuments({
          claimedBy: userId,
          status: { $in: ['claimed', 'in_transit'] },
          expiryTime: { $gt: new Date() },
       }),
        Donation.countDocuments({ claimedBy: userId, status: 'delivered' }),
     ]);
      const deliveredData = await Donation.find({
        claimedBy: userId,
        status: 'delivered',
      }).select('servings quantity');
      const mealsReceived = deliveredData.reduce(
        (sum, d) => sum + (d.servings || Math.floor(d.quantity * 4)),
        0
      );
      stats = { total, active, delivered, mealsReceived };
    } else if (role === 'volunteer') {
  const [assigned, active, completed] = await Promise.all([
    Donation.countDocuments({
      volunteer: userId,
      status: {
        $in: ['claimed', 'in_transit', 'delivered'],
      },
    }),

    Donation.countDocuments({
      volunteer: userId,
      status: 'in_transit',
      expiryTime: { $gt: new Date() },
    }),

    Donation.countDocuments({
      volunteer: userId,
      status: 'delivered',
    }),
  ]);

  stats = {
    assigned,
    active,
    completed,
  };
}

    sendSuccess(res, 'Your stats retrieved.', { stats });
  } catch (error) {
    logger.error('My stats error:', error);
    sendError(res, 'Failed to retrieve stats.', 500);
  }
};
