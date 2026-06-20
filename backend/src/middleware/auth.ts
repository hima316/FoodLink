import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import logger from '../config/logger';

/**
 * Middleware: Authenticate JWT access token
 * Attaches decoded user payload to req.user
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      sendUnauthorized(res, 'Access token required. Please log in.');
      return;
    }

    // Verify and decode the token
    const decoded = verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        sendUnauthorized(res, 'Token expired. Please refresh your session.');
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        sendUnauthorized(res, 'Invalid token. Please log in again.');
        return;
      }
    }

    logger.error('Authentication error:', error);
    sendUnauthorized(res, 'Authentication failed.');
  }
};

/**
 * Middleware: Role-based access control
 * Restricts access to specific user roles
 *
 * Usage: authorize('admin', 'hotel') - allows admin and hotel roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required.');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Access denied for role ${req.user.role}. Required: ${allowedRoles.join(', ')}`
      );
      sendForbidden(
        res,
        `Access restricted. Required role: ${allowedRoles.join(' or ')}`
      );
      return;
    }

    next();
  };
};

/**
 * Middleware: Optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch {
    // Silently ignore invalid/expired tokens for optional auth
  }
  next();
};
