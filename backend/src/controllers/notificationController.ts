import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

/**
 * GET /api/v1/notifications
 * Get notifications for the current user
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const notifications = await Notification.find({
      recipient: req.user!.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name organizationName avatar')
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    sendSuccess(res, 'Notifications retrieved.', {
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    sendError(res, 'Failed to retrieve notifications.', 500);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!.userId },
      { isRead: true }
    );
    sendSuccess(res, 'Notification marked as read.');
  } catch (error) {
    logger.error('Mark notification read error:', error);
    sendError(res, 'Failed to update notification.', 500);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipient: req.user!.userId, isRead: false },
      { isRead: true }
    );
    sendSuccess(res, 'All notifications marked as read.');
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    sendError(res, 'Failed to update notifications.', 500);
  }
};
