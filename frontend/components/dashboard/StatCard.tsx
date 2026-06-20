'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  description?: string;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'teal';
  loading?: boolean;
  delay?: number;
}

const colorMap = {
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/50' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', icon: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/50' },
  red:    { bg: 'bg-red-50 dark:bg-red-950/30', icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-900/50' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-950/30', icon: 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-900/50' },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  description,
  color = 'green',
  loading = false,
  delay = 0,
}: StatCardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-16 h-5 rounded-lg" />
        </div>
        <div className="skeleton w-20 h-8 rounded-lg mb-2" />
        <div className="skeleton w-32 h-4 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn(
        'bg-card border rounded-2xl p-5 hover:shadow-card-hover transition-all duration-300 group',
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            trend > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' :
            trend < 0 ? 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400' :
            'text-muted-foreground bg-muted'
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> :
             trend < 0 ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-2xl font-bold text-foreground font-display">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
        <p className="text-sm font-medium text-foreground/80">{label}</p>
        {(description || trendLabel) && (
          <p className="text-xs text-muted-foreground">
            {trendLabel || description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
