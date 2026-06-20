'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, RefreshCw, TrendingUp, CheckCircle2, Package } from 'lucide-react';
import DonationCard from '../../../../components/dashboard/DonationCard';
import { Donation, DonationStatus } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils';

const STATUS_TABS: { key: DonationStatus | 'all'; label: string; color: string }[] = [
  { key: 'all',       label: 'All',        color: 'bg-foreground text-background' },
  { key: 'delivered', label: '✅ Delivered', color: 'bg-brand-600 text-white' },
  { key: 'expired',   label: '🔴 Expired',  color: 'bg-red-500 text-white' },
  { key: 'cancelled', label: '⬛ Cancelled', color: 'bg-gray-500 text-white' },
];

export default function HotelHistoryPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<DonationStatus | 'all'>('all');
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page), limit: '9',
        sortBy: 'createdAt', sortOrder: 'desc',
      };
      if (tab !== 'all') params.status = tab;
      else params.status = 'delivered';

      const res = await api.get('/donations', { params });
      setDonations(res.data.data.donations);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [tab]);

  // Summary counts from loaded data
  const delivered = donations.filter(d => d.status === 'delivered').length;
  const expired   = donations.filter(d => d.status === 'expired').length;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Donation History</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete record of all your past donations</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Delivered',  value: delivered, icon: CheckCircle2, color: 'bg-brand-50 dark:bg-brand-950/30 text-brand-600' },
          { label: 'Expired',    value: expired,   icon: Package,      color: 'bg-red-50 dark:bg-red-950/30 text-red-600' },
          { label: 'This Page',  value: donations.length, icon: TrendingUp, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              tab === t.key ? t.color + ' shadow-sm' : 'border border-border text-muted-foreground hover:bg-muted'
            )}>
            {t.label}
          </button>
        ))}
        <button onClick={fetchHistory}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <ClipboardList className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">No history yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Your completed donations will appear here</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {donations.map((d, i) => (
            <DonationCard key={d._id} donation={d} delay={i * 0.04} showActions={false} />
          ))}
        </div>
      )}

      {/* Pagination */}
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
    </div>
  );
}
