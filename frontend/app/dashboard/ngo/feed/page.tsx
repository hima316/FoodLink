'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HandHeart, Search, RefreshCw, Filter, X,
  AlertTriangle, Clock, SlidersHorizontal,
} from 'lucide-react';
import DonationCard from '../../../../components/dashboard/DonationCard';
import { Donation, FoodCategory } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils';

const CATEGORY_OPTIONS: { value: FoodCategory | ''; label: string; icon: string }[] = [
  { value: '',                  label: 'All',          icon: '🍽️' },
  { value: 'cooked_meals',      label: 'Cooked',       icon: '🍛' },
  { value: 'raw_ingredients',   label: 'Raw',          icon: '🥕' },
  { value: 'bakery',            label: 'Bakery',       icon: '🥖' },
  { value: 'fruits_vegetables', label: 'Fruits/Veg',   icon: '🥦' },
  { value: 'dairy',             label: 'Dairy',        icon: '🥛' },
  { value: 'packaged_food',     label: 'Packaged',     icon: '📦' },
  { value: 'beverages',         label: 'Beverages',    icon: '🥤' },
];

type SortOption = 'expiryTime' | 'createdAt' | 'quantity';

export default function NGOFeedPage() {
  const [donations,   setDonations]   = useState<Donation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [claimingId,  setClaimingId]  = useState<string | null>(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState<FoodCategory | ''>('');
  const [citySearch, setCitySearch] = useState('');
  const [sortBy,      setSortBy]      = useState<SortOption>('expiryTime');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const fetchDonations = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const params: Record<string, string> = {
        status: 'available',
        page: String(page),
        limit: '9',
        sortBy,
        sortOrder: 'asc',
      };
      if (category)     params.category    = category;
      if (citySearch.trim()) params.city = citySearch.trim();
      if (search)       params.search      = search;
      if (emergencyOnly) params.isEmergency = 'true';
      

      const res = await api.get('/donations', { params });
      // Extra client-side guard: filter out any donations already past expiry
      const now = new Date();
      const fresh = res.data.data.donations.filter(
       (d: Donation) =>
        d.status !== 'expired' &&
        d.status === 'available' &&
        new Date(d.expiryTime) > now
     );
setDonations(fresh);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, category, citySearch, search, sortBy, emergencyOnly]);

  useEffect(() => {
  // Debounce city search — wait 500ms after user stops typing
    const timer = setTimeout(() => { fetchDonations(); }, citySearch ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchDonations, citySearch]);
  useEffect(() => { setPage(1); }, [category, search, sortBy, emergencyOnly]);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDonations(true), 45000);
    return () => clearInterval(interval);
  }, [fetchDonations]);

  const handleClaim = async (donationId: string) => {
    setClaimingId(donationId);
    try {
      await api.patch(`/donations/${donationId}/claim`);
      toast.success('Donation claimed! Assign a volunteer to proceed.');
      setDonations((prev) => prev.filter((d) => d._id !== donationId));
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to claim');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center relative">
            <HandHeart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div className="absolute -top-0.5 -right-0.5 status-dot-online" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Live Donation Feed</h1>
            <p className="text-xs text-muted-foreground">
              {donations.length} available donations · Auto-refreshes every 45s
            </p>
          </div>
        </div>
        <button onClick={() => fetchDonations(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* City search */}
      <div className="relative">
        <input
          type="text"
          value={citySearch}
          onChange={e => setCitySearch(e.target.value)}
          placeholder="Search by city (e.g. Mumbai, Delhi)..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-foreground placeholder:text-muted-foreground/60"
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {citySearch && (
          <button
            onClick={() => setCitySearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setCategory(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold whitespace-nowrap transition-all',
              category === opt.value
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                : 'border-border text-muted-foreground hover:border-brand-300 dark:hover:border-brand-700'
            )}>
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search available donations..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          <option value="expiryTime">Expiring Soon</option>
          <option value="createdAt">Newest First</option>
          <option value="quantity">Largest Quantity</option>
        </select>
        <button onClick={() => setEmergencyOnly(!emergencyOnly)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
            emergencyOnly
              ? 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
              : 'border-border text-muted-foreground hover:border-red-300'
          )}>
          <AlertTriangle className="w-4 h-4" />
          {emergencyOnly ? 'Emergency Only' : 'Show Emergency'}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <HandHeart className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">No available donations</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {emergencyOnly || category || search ? 'Try adjusting your filters' : 'Check back soon — hotels post throughout the day'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {donations.map((d, i) => (
              <DonationCard
                key={d._id}
                donation={d}
                delay={i * 0.04}
                onClaim={claimingId ? undefined : handleClaim}
                onView={(id) => (window.location.href = `/dashboard/ngo/donations/${id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
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
