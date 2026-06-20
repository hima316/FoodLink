// ==========================================
// USER TYPES
// ==========================================

export type UserRole = 'hotel' | 'ngo' | 'volunteer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  address?: Address;
  location?: GeoLocation;
  organizationName?: string;
  organizationType?: string;
  registrationNumber?: string;
  bio?: string;
  rating?: number;
  totalDonations?: number;
  totalPickups?: number;
  totalReceived?: number;
  isVerified: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// ==========================================
// DONATION TYPES
// ==========================================

export type DonationStatus =
  | 'available'
  | 'claimed'
  | 'in_transit'
  | 'delivered'
  | 'expired'
  | 'cancelled';

export type FoodCategory =
  | 'cooked_meals'
  | 'raw_ingredients'
  | 'bakery'
  | 'beverages'
  | 'fruits_vegetables'
  | 'dairy'
  | 'packaged_food'
  | 'other';

export interface Donation {
  _id: string;
  id?: string;
  donor: User | string;
  claimedBy?: User | string;
  volunteer?: User | string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  servings?: number;
  expiryTime: string;
  pickupDeadline: string;
  images?: string[];
  address: Address;
  location: GeoLocation;
  status: DonationStatus;
  isEmergency: boolean;
  allergens?: string[];
  specialInstructions?: string;
  temperatureRequirements?: 'ambient' | 'refrigerated' | 'frozen';
  claimedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  timeRemaining?: number;
  isExpired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationData {
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  servings?: number;
  expiryTime: string;
  pickupDeadline: string;
  address: Address;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  allergens?: string[];
  specialInstructions?: string;
  temperatureRequirements?: 'ambient' | 'refrigerated' | 'frozen';
  isEmergency?: boolean;
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export type NotificationType =
  | 'donation_available'
  | 'donation_claimed'
  | 'donation_picked_up'
  | 'donation_delivered'
  | 'donation_expired'
  | 'emergency_request'
  | 'volunteer_assigned'
  | 'system_alert';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface AnalyticsOverview {
  totalDonations: number;
  activeDonations: number;
  deliveredDonations: number;
  totalMealsSaved: number;
  totalFoodKg: number;
  totalNGOsSupported: number;
  totalVolunteers: number;
  totalHotels: number;
  totalNGOs: number;
}

export interface MonthlyStats {
  month: string;
  donations: number;
  delivered: number;
  meals: number;
  foodKg: number;
}

export interface MyStats {
  // Hotel stats
  total?: number;
  active?: number;
  delivered?: number;
  claimed?: number;
  mealsSaved?: number;
  // NGO stats
  mealsReceived?: number;
  // Volunteer stats
  assigned?: number;
  completed?: number;
}

// ==========================================
// AUTH TYPES
// ==========================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationName?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==========================================
// FILTER/SORT TYPES
// ==========================================

export interface DonationFilters {
  status?: DonationStatus | '';
  category?: FoodCategory | '';
  isEmergency?: boolean;
  city?: string;
  search?: string;
  sortBy?: 'createdAt' | 'expiryTime' | 'quantity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ==========================================
// MAP TYPES
// ==========================================

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'donation' | 'ngo' | 'volunteer';
  title: string;
  description?: string;
  status?: DonationStatus;
}

// ==========================================
// DASHBOARD STAT CARD
// ==========================================

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: number;
  color?: string;
}

// Food category labels for display
export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  cooked_meals: 'Cooked Meals',
  raw_ingredients: 'Raw Ingredients',
  bakery: 'Bakery & Bread',
  beverages: 'Beverages',
  fruits_vegetables: 'Fruits & Vegetables',
  dairy: 'Dairy Products',
  packaged_food: 'Packaged Food',
  other: 'Other',
};

// Donation status labels for display
export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  available: 'Available',
  claimed: 'Claimed',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

// Role labels for display
export const ROLE_LABELS: Record<UserRole, string> = {
  hotel: 'Hotel / Restaurant',
  ngo: 'NGO / Charity',
  volunteer: 'Volunteer',
  admin: 'Administrator',
};
