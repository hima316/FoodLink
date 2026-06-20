import { Request, Response } from 'express';
import User from '../models/User';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import {
  sendSuccess, sendError, sendBadRequest, sendUnauthorized,
} from '../utils/response';
import { AuthRequest, JWTPayload } from '../types';
import logger from '../config/logger';

/** POST /api/v1/auth/register */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, organizationName, phone, address } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) { sendError(res, 'Email already registered. Please log in.', 409); return; }

    if ((role === 'hotel' || role === 'ngo') && !organizationName) {
      sendBadRequest(res, 'Organization name is required for hotels and NGOs.'); return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, role,
      organizationName: organizationName?.trim(),
      phone: phone?.trim(),
      address,
    });

    const tokenPayload: JWTPayload = {
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    };
    const tokens = generateTokenPair(tokenPayload);

    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
      lastLogin:    new Date(),
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);

    sendSuccess(res, 'Account created successfully! Welcome to FoodLink.', {
      user: {
        id:               user._id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        organizationName: user.organizationName,
        avatar:           user.avatar,
        isVerified:       user.isVerified,
      },
      tokens,
    }, 201);
  } catch (error) {
    logger.error('Register error:', error);
    sendError(res, 'Registration failed. Please try again.', 500);
  }
};

/** POST /api/v1/auth/login */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) { sendUnauthorized(res, 'Invalid email or password.'); return; }

    if (user.status === 'suspended') { sendError(res, 'Account suspended. Please contact support.', 403); return; }
    if (user.status === 'inactive')  { sendError(res, 'Account inactive. Please verify your email.', 403); return; }

    const isValid = await user.comparePassword(password);
    if (!isValid) { sendUnauthorized(res, 'Invalid email or password.'); return; }

    const tokenPayload: JWTPayload = {
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    };
    const tokens = generateTokenPair(tokenPayload);

    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
      lastLogin:    new Date(),
    });

    logger.info(`User logged in: ${user.email}`);

    sendSuccess(res, 'Login successful. Welcome back!', {
      user: {
        id:               user._id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        organizationName: user.organizationName,
        avatar:           user.avatar,
        isVerified:       user.isVerified,
        status:           user.status,
      },
      tokens,
    });
  } catch (error) {
    logger.error('Login error:', error);
    sendError(res, 'Login failed. Please try again.', 500);
  }
};

/** POST /api/v1/auth/refresh */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) { sendBadRequest(res, 'Refresh token is required.'); return; }

    let decoded: JWTPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      sendUnauthorized(res, 'Invalid or expired refresh token.'); return;
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      sendUnauthorized(res, 'Invalid refresh token. Please log in again.'); return;
    }

    const tokenPayload: JWTPayload = {
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    };
    const tokens = generateTokenPair(tokenPayload);

    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });
    sendSuccess(res, 'Tokens refreshed successfully.', { tokens });
  } catch (error) {
    logger.error('Refresh token error:', error);
    sendError(res, 'Token refresh failed.', 500);
  }
};

/** POST /api/v1/auth/logout */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, { $unset: { refreshToken: 1 } });
    }
    sendSuccess(res, 'Logged out successfully.');
  } catch (error) {
    logger.error('Logout error:', error);
    sendError(res, 'Logout failed.', 500);
  }
};

/** GET /api/v1/auth/me */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) { sendUnauthorized(res, 'User not found. Please log in again.'); return; }
    sendSuccess(res, 'Profile retrieved successfully.', { user });
  } catch (error) {
    logger.error('Get me error:', error);
    sendError(res, 'Failed to retrieve profile.', 500);
  }
};
