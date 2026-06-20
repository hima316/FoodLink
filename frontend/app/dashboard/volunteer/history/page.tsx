'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, RefreshCw, CheckCircle2, Star, TrendingUp } from 'lucide-react';
import DonationCard from '../../../../components/dashboard/DonationCard';
import { Donation } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils';
import useAuthStore from '../../../../context/authStore';

export default function VolunteerHistoryPage() {
  const { user }     = useAuthStore();
  const [donations,  setDonations]  = useState<Donation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/donations?status=delivered&page=${page}&limit=9&sortBy=deliveredAt&sortOrder=desc`
      );
      setDonations(res.data.data.donations);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
      setTotal(res.data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Delivery History</h1>
        <p className="text-sm text-muted-foreground mt-1">All your completed food deliveries</p>
      </motion.div>

      {/* Personal stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Deliveries', value: user?.totalPickups ?? total, icon: CheckCircle2, color: 'text-brand-600' },
          { label: 'Rating',           value: user?.rating ? `${user.rating}/5` : '—',         icon: Star,         color: 'text-amber-500' },
          { label: 'This Page',        value: donations.length, icon: TrendingUp, color: 'text-blue-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 text-center">
              <Icon className={cn('w-5 h-5 mx-auto mb-1', s.color)} />
              <p className={cn('text-xl font-display font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Achievement banner */}
      {(user?.totalPickups ?? 0) >= 10 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <Star className="w-6 h-6 fill-white flex-shrink-0" />
          <div>
            <p className="font-bold">🏆 Star Volunteer!</p>
            <p className="text-sm text-white/80">
              You've completed {user?.totalPickups} deliveries. Thank you for your service!
            </p>
          </div>
        </motion.div>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <button onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
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
          <p className="font-semibold text-muted-foreground text-lg">No deliveries yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Complete your first pickup to start building your history
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
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted">
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
