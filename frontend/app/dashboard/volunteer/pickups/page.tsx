'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, CheckCircle2, MapPin, Clock,
  RefreshCw, Package, Navigation,
} from 'lucide-react';
import { cn, formatTimeRemaining, formatAddress, getDonorName } from '../../../../lib/utils';
import { Donation } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function VolunteerPickupsPage() {
  const [donations,  setDonations]  = useState<Donation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [delivering, setDelivering] = useState<string | null>(null);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        '/donations?status=in_transit&limit=20&sortBy=createdAt&sortOrder=desc'
      );
      const now = new Date();
      const active = (res.data.data.donations as Donation[]).filter(
        (d) => d.status === 'in_transit' && new Date(d.expiryTime) > now
      );
      setDonations(active);
    } catch {
      toast.error('Failed to load active pickups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPickups(); }, [fetchPickups]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchPickups, 60000);
    return () => clearInterval(interval);
  }, [fetchPickups]);

  const handleMarkDelivered = async (id: string, donationTitle: string) => {
    setDelivering(id);
    try {
      await api.patch(`/donations/${id}/deliver`);
      toast.success(`"${donationTitle}" marked as delivered! Great work 🎉`);
      // Remove from active list
      setDonations(prev => prev.filter(d => d._id !== id));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setDelivering(null);
    }
  };

  // Get NGO name from claimedBy
  const getNGOName = (claimedBy: unknown): string => {
    if (!claimedBy || typeof claimedBy === 'string') return '';
    const c = claimedBy as { organizationName?: string; name?: string };
    return c.organizationName || c.name || '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Active Pickups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {donations.length > 0
              ? `${donations.length} active pickup${donations.length > 1 ? 's' : ''} in progress`
              : 'No active pickups right now'}
          </p>
        </div>
        <button
          onClick={fetchPickups}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* ── Info banner when active pickups exist */}
      {!loading && donations.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <Truck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You have active pickups. Navigate to the pickup address, collect the food,
            and click <strong>Mark Delivered</strong> once you have handed it to the NGO.
          </p>
        </div>
      )}

      {/* ── Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}
              className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex gap-3">
                <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-1/2 rounded" />
                  <div className="skeleton h-4 w-1/3 rounded" />
                </div>
                <div className="skeleton h-8 w-24 rounded-xl flex-shrink-0" />
              </div>
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton h-10 rounded-xl" />
                <div className="skeleton h-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-amber-500" />
          </div>
          <p className="font-semibold text-foreground text-lg">No active pickups</p>
          <p className="text-sm text-muted-foreground mt-1">
            An NGO will assign you a pickup — you'll get a notification when that happens.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {donations.map((d, i) => {
            const timeInfo   = formatTimeRemaining(d.expiryTime);
            const donorName  = getDonorName(d.donor);
            const ngoName    = getNGOName(d.claimedBy);

            // Check if food is expired — should never reach here due to filter
            // but add an extra guard just in case
            const isExpired =
              d.status === 'expired' || new Date(d.expiryTime) <= new Date();

            return (
              <motion.div key={d._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border-2 border-amber-200 dark:border-amber-800/50 rounded-2xl overflow-hidden">

                {/* Top status bar */}
                <div className="bg-amber-500 px-5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-bold uppercase tracking-wide">
                      In Transit
                    </span>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs font-bold',
                    timeInfo.urgency === 'critical'
                      ? 'text-red-200'
                      : timeInfo.urgency === 'warning'
                      ? 'text-amber-100'
                      : 'text-white/80'
                  )}>
                    <Clock className="w-3.5 h-3.5" />
                    {timeInfo.label}
                  </div>
                </div>

                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-base leading-tight">
                        {d.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pickup from: <span className="font-medium">{donorName}</span>
                      </p>
                      {ngoName && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
                          Deliver to: <span className="font-medium">{ngoName}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-display font-bold text-foreground">
                        {d.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">{d.unit}</p>
                    </div>
                  </div>

                  {/* Info chips */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Category</p>
                      <p className="text-sm font-semibold text-foreground capitalize">
                        {d.category.replace('_', ' ')}
                      </p>
                    </div>
                    {d.servings ? (
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Feeds</p>
                        <p className="text-sm font-semibold text-foreground">
                          ~{d.servings} people
                        </p>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Temp</p>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {d.temperatureRequirements || 'Ambient'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4 p-3 rounded-xl bg-muted/30">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{formatAddress(d.address)}</span>
                  </div>

                  {/* Special instructions */}
                  {d.specialInstructions && (
                    <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3 mb-4">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        Instructions:{' '}
                      </span>
                      {d.specialInstructions}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {/* Navigate button — always available */}
                    <button
                      onClick={() =>
                        toast(
                          `📍 Pickup address:\n${formatAddress(d.address)}`,
                          { duration: 6000, icon: '🗺️' }
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all">
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>

                    {/* Mark Delivered — ONLY if food is NOT expired */}
                    {!isExpired ? (
                      <button
                        onClick={() => handleMarkDelivered(d._id, d.title)}
                        disabled={delivering === d._id}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-sm',
                          'bg-brand-600 hover:bg-brand-700 hover:shadow-glow',
                          delivering === d._id && 'opacity-60 cursor-not-allowed'
                        )}>
                        {delivering === d._id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" /> Mark Delivered</>
                        )}
                      </button>
                    ) : (
                      /* Expired food — show disabled message instead */
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-500 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Food Expired
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}