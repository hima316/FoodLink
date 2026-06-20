import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, differenceInMinutes, differenceInHours } from 'date-fns';
import { DonationStatus, FoodCategory } from '../types';

// ==========================================
// Tailwind Class Merger
// ==========================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================================
// Date Formatters
// ==========================================
export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy · h:mm a');
};

export const formatTimeAgo = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatTimeRemaining = (expiryTime: string | Date): {
  label: string;
  minutes: number;
  urgency: 'critical' | 'warning' | 'normal';
} => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const minutesLeft = differenceInMinutes(expiry, now);
  const hoursLeft = differenceInHours(expiry, now);

  if (minutesLeft <= 0) {
    return { label: 'Expired', minutes: 0, urgency: 'critical' };
  }

  let label: string;
  if (minutesLeft < 60) {
    label = `${minutesLeft}m left`;
  } else if (hoursLeft < 24) {
    const remainingMins = minutesLeft % 60;
    label = remainingMins > 0
      ? `${hoursLeft}h ${remainingMins}m left`
      : `${hoursLeft}h left`;
  } else {
    const days = Math.floor(hoursLeft / 24);
    label = `${days}d left`;
  }

  const urgency: 'critical' | 'warning' | 'normal' =
    minutesLeft <= 60 ? 'critical' : minutesLeft <= 180 ? 'warning' : 'normal';

  return { label, minutes: minutesLeft, urgency };
};

// ==========================================
// Number Formatters
// ==========================================
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatKg = (kg: number): string => {
  return `${kg.toLocaleString('en-IN')} kg`;
};

// ==========================================
// Status Helpers
// ==========================================
export const getStatusColor = (status: DonationStatus): string => {
  const map: Record<DonationStatus, string> = {
    available:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    claimed:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    in_transit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    delivered:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    expired:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return map[status] || map.available;
};

export const getCategoryIcon = (category: FoodCategory): string => {
  const map: Record<FoodCategory, string> = {
    cooked_meals:     '🍽️',
    raw_ingredients:  '🥕',
    bakery:           '🥖',
    beverages:        '🥤',
    fruits_vegetables:'🥦',
    dairy:            '🥛',
    packaged_food:    '📦',
    other:            '🍱',
  };
  return map[category] || '🍱';
};

export const getCategoryLabel = (category: FoodCategory): string => {
  const map: Record<FoodCategory, string> = {
    cooked_meals:     'Cooked Meals',
    raw_ingredients:  'Raw Ingredients',
    bakery:           'Bakery & Bread',
    beverages:        'Beverages',
    fruits_vegetables:'Fruits & Vegetables',
    dairy:            'Dairy Products',
    packaged_food:    'Packaged Food',
    other:            'Other',
  };
  return map[category] || 'Other';
};

export const getTemperatureLabel = (temp?: string): string => {
  const map: Record<string, string> = {
    ambient:     '🌡️ Room Temp',
    refrigerated:'❄️ Refrigerated',
    frozen:      '🧊 Frozen',
  };
  return temp ? (map[temp] || temp) : '🌡️ Room Temp';
};

// ==========================================
// String Helpers
// ==========================================
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ==========================================
// Validation Helpers
// ==========================================
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getPasswordStrength = (
  password: string
): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'text-red-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'text-amber-500' };
  if (score === 4) return { score, label: 'Good', color: 'text-blue-500' };
  return { score, label: 'Strong', color: 'text-emerald-500' };
};

// ==========================================
// Address Formatter
// ==========================================
export const formatAddress = (address?: {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}): string => {
  if (!address) return 'Location not specified';
  const parts = [address.street, address.city, address.state, address.country].filter(Boolean);
  return parts.join(', ') || 'Location not specified';
};

// ==========================================
// Donor Name Helper
// ==========================================
export const getDonorName = (donor: unknown): string => {
  if (!donor) return 'Unknown';
  if (typeof donor === 'string') return donor;
  if (typeof donor === 'object' && donor !== null) {
    const d = donor as { organizationName?: string; name?: string };
    return d.organizationName || d.name || 'Unknown';
  }
  return 'Unknown';
};
