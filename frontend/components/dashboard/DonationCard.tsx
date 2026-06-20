'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, MapPin, Thermometer, Users, Package,
  AlertTriangle, ChevronRight, Leaf,
} from 'lucide-react';
import { cn, getStatusColor, getCategoryIcon, getCategoryLabel,
  formatTimeRemaining, formatAddress, getDonorName,
  getTemperatureLabel, formatNumber } from '../../lib/utils';
import { Donation } from '../../types';

interface DonationCardProps {
  donation: Donation;
  onClaim?: (id: string) => void;
  onView?: (id: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
  delay?: number;
  allowExpired?: boolean;
}

// ── Live countdown hook
function useCountdown(expiryTime: string) {
  const [timeInfo, setTimeInfo] = useState(() =>
    formatTimeRemaining(expiryTime)
  );

  useEffect(() => {
    const tick = () => setTimeInfo(formatTimeRemaining(expiryTime));
    tick();
    const interval = setInterval(tick, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [expiryTime]);

  return timeInfo;
}

export default function DonationCard({
  donation,
  onClaim,
  onView,
  showActions = true,
  variant = 'default',
  delay = 0,
  allowExpired = false,
}: DonationCardProps) {
  const timeInfo = useCountdown(donation.expiryTime);
  const isAvailable =
   donation.status === 'available' &&
   new Date(donation.expiryTime) > new Date(); 
  const isEmergency = donation.isEmergency;

  const donorName = getDonorName(donation.donor);
  const categoryIcon = getCategoryIcon(donation.category);
  const categoryLabel = getCategoryLabel(donation.category);
  const location = formatAddress(donation.address);

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.3 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand-300 dark:hover:border-brand-700 hover:bg-muted/40 transition-all cursor-pointer group',
          isEmergency && 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/10'
        )}
        onClick={() => onView?.(donation._id)}
      >
        <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-muted flex-shrink-0">
          {categoryIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isEmergency && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
            <p className="text-sm font-semibold text-foreground truncate">{donation.title}</p>
          </div>
          <p className="text-xs text-muted-foreground">{donorName} · {donation.quantity} {donation.unit}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', getStatusColor(donation.status))}>
            {donation.status.replace('_', ' ')}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        'bg-card border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 group',
        isEmergency
          ? 'border-red-300 dark:border-red-800/60 emergency-pulse'
          : 'border-border hover:border-brand-200 dark:hover:border-brand-800/50'
      )}
    >
      {/* Emergency Banner */}
      {isEmergency && (
        <div className="bg-red-500 px-4 py-1.5 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-bold uppercase tracking-wide">Emergency Request</span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-muted flex-shrink-0">
              {categoryIcon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-base leading-tight truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {donation.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Leaf className="w-3 h-3 text-brand-500" />
                {donorName}
              </p>
            </div>
          </div>
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0',
            getStatusColor(donation.status)
          )}>
            {donation.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {donation.description}
        </p>

        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <span className="font-medium text-foreground">{donation.quantity} {donation.unit}</span>
          </div>
          {donation.servings && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="font-medium text-foreground">~{formatNumber(donation.servings)} servings</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Thermometer className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{getTemperatureLabel(donation.temperatureRequirements)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-base">{categoryIcon}</span>
            <span>{categoryLabel}</span>
          </div>
        </div>
      </div>

      {/* Location & Timer */}
      <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        {/* Expiry countdown */}
        <div className={cn(
          'flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap flex-shrink-0',
          timeInfo.urgency === 'critical'
            ? 'text-red-500 animate-countdown-pulse'
            : timeInfo.urgency === 'warning'
            ? 'text-amber-500'
            : 'text-emerald-600 dark:text-emerald-400'
        )}>
          <Clock className="w-3.5 h-3.5" />
          {timeInfo.label}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-5 py-3 border-t border-border/50 flex items-center gap-2">
          <button
            onClick={() => onView?.(donation._id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/60 transition-all"
          >
            View Details
          </button>
          {isAvailable && onClaim && (
            <button
              onClick={() => onClaim(donation._id)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm',
                isEmergency
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-brand-600 hover:bg-brand-700 hover:shadow-glow'
              )}
            >
              {isEmergency ? '🚨 Claim Now' : 'Claim Donation'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

