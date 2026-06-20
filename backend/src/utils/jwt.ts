import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload, AuthTokens } from '../types';

/**
 * Generate JWT access token (short-lived: 15 minutes)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'foodlink-api',
    audience: 'foodlink-client',
  });
};

/**
 * Generate JWT refresh token (long-lived: 7 days)
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'foodlink-api',
    audience: 'foodlink-client',
  });
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: JWTPayload): AuthTokens => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify and decode an access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'foodlink-api',
    audience: 'foodlink-client',
  }) as JWTPayload;
};

/**
 * Verify and decode a refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'foodlink-api',
    audience: 'foodlink-client',
  }) as JWTPayload;
};

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
};
