import { Request } from 'express';
import { Types } from 'mongoose';

// Re-export model types so controllers can use one import path
export type { IUser, UserRole, UserStatus }         from '../models/User';
export type { IDonation, DonationStatus, FoodCategory } from '../models/Donation';
export type { INotification, NotificationType }     from '../models/Notification';

// ==========================================
// ADDRESS & LOCATION
// ==========================================
export interface IAddress {
  street?:  string;
  city?:    string;
  state?:   string;
  country?: string;
  zipCode?: string;
}

export interface ILocation {
  type:        'Point';
  coordinates: [number, number];
}

// ==========================================
// EMERGENCY REQUEST
// ==========================================
export type EmergencyStatus = 'open' | 'responding' | 'resolved' | 'closed';

export interface IEmergencyRequest {
  _id:           Types.ObjectId;
  requestedBy:   Types.ObjectId;
  title:         string;
  description:   string;
  urgencyLevel:  'critical' | 'high' | 'medium';
  peopleCount:   number;
  status:        EmergencyStatus;
  location:      ILocation;
  address:       IAddress;
  respondedBy?:  Types.ObjectId[];
  resolvedAt?:   Date;
  createdAt:     Date;
  updatedAt:     Date;
}

// ==========================================
// ANALYTICS
// ==========================================
export interface IMonthlyStats {
  month:     string;
  donations: number;
  meals:     number;
  volunteers:number;
}

// ==========================================
// EXPRESS REQUEST EXTENSION
// ==========================================
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email:  string;
    role:   import('../models/User').UserRole;
  };
}

// ==========================================
// API RESPONSE
// ==========================================
export interface ApiResponse<T = unknown> {
  success:     boolean;
  message:     string;
  data?:       T;
  error?:      string;
  pagination?: IPagination;
}

export interface IPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

// ==========================================
// AUTH
// ==========================================
export interface JWTPayload {
  userId: string;
  email:  string;
  role:   import('../models/User').UserRole;
  iat?:   number;
  exp?:   number;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterData {
  name:              string;
  email:             string;
  password:          string;
  role:              import('../models/User').UserRole;
  organizationName?: string;
  phone?:            string;
}
