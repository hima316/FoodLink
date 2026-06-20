import { Response } from 'express';
import { ApiResponse, IPagination } from '../types';

/**
 * Send a standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  pagination?: IPagination
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(error && { error }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a 400 Bad Request error
 */
export const sendBadRequest = (res: Response, message: string): Response =>
  sendError(res, message, 400);

/**
 * Send a 401 Unauthorized error
 */
export const sendUnauthorized = (
  res: Response,
  message = 'Unauthorized. Please log in.'
): Response => sendError(res, message, 401);

/**
 * Send a 403 Forbidden error
 */
export const sendForbidden = (
  res: Response,
  message = 'Access forbidden. Insufficient permissions.'
): Response => sendError(res, message, 403);

/**
 * Send a 404 Not Found error
 */
export const sendNotFound = (
  res: Response,
  resource = 'Resource'
): Response => sendError(res, `${resource} not found`, 404);

/**
 * Calculate pagination metadata
 */
export const buildPagination = (
  page: number,
  limit: number,
  total: number
): IPagination => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Parse pagination query parameters
 */
export const parsePaginationParams = (
  query: Record<string, unknown>
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
