'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, RefreshCw, MapPin, Clock, Filter } from 'lucide-react';
import DonationCard from '../../../../components/dashboard/DonationCard';
import { Donation, FoodCategory } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils';

export default function VolunteerAvailablePage() {
  const [donations,  setDonations]  = useState<Donation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category,   setCategory]   = useState<FoodCategory | ''>('');

  const CATEGORIES: { value: FoodCategory | ''; label: string }[] = [
    { value: '',                  label: 'All Types' },
    { value: 'cooked_meals',      label: '🍽️ Cooked' },
    { value: 'bakery',            label: '🥖 Bakery' },
    { value: 'fruits_vegetables', label: '🥦 Fruits/Veg' },
    { value: 'packaged_food',     label: '📦 Packaged' },
    { value: 'other',             label: '🍱 Other' },
  ];

  const fetchAvailable = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const params: Record<string, string> = {
        status: 'claimed', page: String(page), limit: '9',
        sortBy: 'expiryTime', sortOrder: 'asc',
      };
      if (category) params.category = category;
      const res = await api.get('/donations', { params });
// Extra safety: never show expired on this page
      const fresh = (res.data.data.donations as Donation[]).filter(
        d => d.status !== 'expired' && new Date(d.expiryTime) > new Date()
      );
setDonations(fresh);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load available pickups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, category]);

  useEffect(() => { fetchAvailable(); }, [fetchAvailable]);
  useEffect(() => { setPage(1); }, [category]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAvailable(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAvailable]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Available Pickups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Donations claimed by NGOs that need a volunteer for pickup
          </p>
        </div>
        <button onClick={() => fetchAvailable(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-400">
          These donations have been claimed by NGOs and are waiting for a volunteer.
          Contact the NGO shown on the card to get assigned as the pickup volunteer.
        </p>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border-2 transition-all',
              category === c.value
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                : 'border-border text-muted-foreground hover:border-brand-300'
            )}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Package className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">No pickups available</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Check back soon — NGOs claim donations throughout the day
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {donations.map((d, i) => (
              <DonationCard key={d._id} donation={d} delay={i * 0.04} showActions={false} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
