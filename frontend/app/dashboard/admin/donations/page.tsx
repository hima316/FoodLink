'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, Search, X, RefreshCw,
  Filter, AlertTriangle, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { Donation, DonationStatus, FoodCategory } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import {
  cn, formatDate, formatTimeRemaining,
  getCategoryIcon, getDonorName, formatAddress,
} from '../../../../lib/utils';

const STATUS_OPTS: { value: DonationStatus | ''; label: string; color: string }[] = [
  { value: '',           label: 'All Status',  color: '' },
  { value: 'available',  label: 'Available',   color: 'text-brand-600' },
  { value: 'claimed',    label: 'Claimed',     color: 'text-blue-600' },
  { value: 'in_transit', label: 'In Transit',  color: 'text-amber-600' },
  { value: 'delivered',  label: 'Delivered',   color: 'text-purple-600' },
  { value: 'expired',    label: 'Expired',     color: 'text-red-600' },
  { value: 'cancelled',  label: 'Cancelled',   color: 'text-gray-500' },
];

const statusIcon: Record<string, React.ElementType> = {
  available: Clock, claimed: Clock, in_transit: Clock,
  delivered: CheckCircle2, expired: XCircle, cancelled: XCircle,
};

const statusBg: Record<string, string> = {
  available:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  claimed:    'bg-blue-100    dark:bg-blue-900/30    text-blue-700    dark:text-blue-400',
  in_transit: 'bg-amber-100   dark:bg-amber-900/30   text-amber-700   dark:text-amber-400',
  delivered:  'bg-purple-100  dark:bg-purple-900/30  text-purple-700  dark:text-purple-400',
  expired:    'bg-red-100     dark:bg-red-900/30     text-red-700     dark:text-red-400',
  cancelled:  'bg-gray-100    dark:bg-gray-800       text-gray-600    dark:text-gray-400',
};

export default function AdminDonationsPage() {
  const [donations,   setDonations]   = useState<Donation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState('');
  const [status,      setStatus]      = useState<DonationStatus | ''>('');
  const [emergency,   setEmergency]   = useState(false);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page), limit: '10',
        sortBy: 'createdAt', sortOrder: 'desc',
      };
      if (status)    params.status      = status;
      if (search)    params.search      = search;
      if (emergency) params.isEmergency = 'true';

      const res = await api.get('/donations', { params });
      setDonations(res.data.data.donations);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
      setTotal(res.data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, emergency]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { setPage(1); }, [status, search, emergency]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this donation?')) return;
    try {
      await api.delete(`/donations/${id}`);
      toast.success('Donation cancelled');
      fetchDonations();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">All Donations</h1>
            <p className="text-xs text-muted-foreground">{total} total donations on the platform</p>
          </div>
        </div>
        <button onClick={fetchDonations}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, description..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as DonationStatus | '')}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setEmergency(!emergency)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all whitespace-nowrap',
            emergency
              ? 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
              : 'border-border text-muted-foreground hover:border-red-300'
          )}>
          <AlertTriangle className="w-4 h-4" />
          {emergency ? 'Emergency Only' : 'All Types'}
        </button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
                <div className="skeleton h-7 w-20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No donations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['Donation', 'Donor', 'Quantity', 'Location', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map((d, i) => {
                  const SIcon    = statusIcon[d.status] || Clock;
                  const timeInfo = formatTimeRemaining(d.expiryTime);
                  return (
                    <motion.tr key={d._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">

                      {/* Donation */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(d.category)}</span>
                          <div>
                            <p className="font-semibold text-foreground truncate max-w-[160px]">{d.title}</p>
                            {d.isEmergency && (
                              <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> EMERGENCY
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Donor */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                          {getDonorName(d.donor)}
                        </p>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{d.quantity} {d.unit}</span>
                        {d.servings && (
                          <p className="text-xs text-muted-foreground">~{d.servings} servings</p>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground truncate max-w-[100px] block">
                          {d.address?.city || 'N/A'}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium',
                          timeInfo.urgency === 'critical' ? 'text-red-500' :
                          timeInfo.urgency === 'warning'  ? 'text-amber-500' : 'text-muted-foreground')}>
                          {timeInfo.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
                          statusBg[d.status] || 'bg-muted text-muted-foreground')}>
                          <SIcon className="w-3 h-3" />
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {['available', 'claimed'].includes(d.status) && (
                          <button onClick={() => handleCancel(d._id)}
                            className="text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
