'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, X, RefreshCw, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import DonationCard from '../../../../components/dashboard/DonationCard';
import { Donation, DonationStatus, FoodCategory } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils';

const STATUS_OPTIONS: { value: DonationStatus | ''; label: string }[] = [
  { value: '',           label: 'All Status' },
  { value: 'available',  label: '🟢 Available' },
  { value: 'claimed',    label: '🔵 Claimed' },
  { value: 'in_transit', label: '🟡 In Transit' },
  { value: 'delivered',  label: '✅ Delivered' },
];

const CATEGORY_OPTIONS: { value: FoodCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'cooked_meals',      label: '🍽️ Cooked Meals' },
  { value: 'raw_ingredients',   label: '🥕 Raw Ingredients' },
  { value: 'bakery',            label: '🥖 Bakery' },
  { value: 'fruits_vegetables', label: '🥦 Fruits & Veg' },
  { value: 'dairy',             label: '🥛 Dairy' },
  { value: 'packaged_food',     label: '📦 Packaged' },
  { value: 'beverages',         label: '🥤 Beverages' },
  { value: 'other',             label: '🍱 Other' },
];

export default function HotelDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState<DonationStatus | ''>('');
  const [category, setCategory] = useState<FoodCategory | ''>('');
  const [sortBy,   setSortBy]   = useState<'createdAt' | 'expiryTime'>('createdAt');

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page), limit: '9',
        sortBy, sortOrder: 'desc',
      };
      if (status)   params.status   = status;
      if (category) params.category = category;
      if (search)   params.search   = search;

      if (!status) {
       params.excludeExpired = 'true';
      }

      const res = await api.get('/donations', { params });
      // Hide expired from main donations list
      const visible = (res.data.data.donations as Donation[]).filter(
        d => status === 'expired' ? true : d.status !== 'expired'
      );
      setDonations(visible);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [page, status, category, search, sortBy]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, category, search, sortBy]);

  const handleCancel = async (id: string) => {
    try {
      await api.delete(`/donations/${id}`);
      toast.success('Donation cancelled');
      fetchDonations();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel');
    }
  };

  const hasFilters = status || category || search;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Donations</h1>
          <p className="text-sm text-muted-foreground">Manage and track all your food donations</p>
        </div>
        <Link href="/dashboard/hotel/new-donation"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-all shadow-md hover:shadow-glow">
          <Plus className="w-4 h-4" />
          New Donation
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donations..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select value={status} onChange={(e) => setStatus(e.target.value as DonationStatus | '')}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Category filter */}
        <select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory | '')}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          <option value="createdAt">Newest First</option>
          <option value="expiryTime">Expiry First</option>
        </select>

        {/* Refresh */}
        <button onClick={fetchDonations}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Active Filters Badge */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Filtered results</span>
          <button onClick={() => { setStatus(''); setCategory(''); setSearch(''); }}
            className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>
      )}

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
          <UtensilsCrossed className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">No donations found</p>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-5">
            {hasFilters ? 'Try different filter options' : 'Start by creating your first donation'}
          </p>
          {!hasFilters && (
            <Link href="/dashboard/hotel/new-donation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-all">
              <Plus className="w-4 h-4" />
              Post First Donation
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {donations.map((d, i) => (
            <DonationCard
              key={d._id}
              donation={d}
              delay={i * 0.04}
              showActions={d.status === 'available'}
              onView={(id) => (window.location.href = `/dashboard/hotel/donations/${id}`)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}
