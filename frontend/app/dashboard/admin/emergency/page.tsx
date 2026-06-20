'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, RefreshCw, Clock, Users,
  MapPin, CheckCircle2, XCircle, Zap,
} from 'lucide-react';
import { Donation } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn, formatTimeAgo, formatAddress, getDonorName } from '../../../../lib/utils';

export default function AdminEmergencyPage() {
  const [emergencies, setEmergencies] = useState<Donation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'active' | 'all'>('active');

  useEffect(() => { fetchEmergencies(); }, [tab]);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        isEmergency: 'true', limit: '20',
        sortBy: 'createdAt', sortOrder: 'desc',
      };
      if (tab === 'active') params.status = 'available';
      const res = await api.get('/donations', { params });
      setEmergencies(res.data.data.donations);
    } catch {
      toast.error('Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this emergency donation?')) return;
    try {
      await api.delete(`/donations/${id}`);
      toast.success('Emergency donation cancelled');
      setEmergencies(prev => prev.filter(e => e._id !== id));
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const activeCount = emergencies.filter(e => e.status === 'available').length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-6 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Emergency Management</h1>
              <p className="text-white/70 text-sm">
                {activeCount} active emergency donation{activeCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={fetchEmergencies}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/20">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'active', label: '🔴 Active Only' },
          { key: 'all',    label: 'All Emergency' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'active' | 'all')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === t.key
                ? 'bg-red-500 text-white shadow-sm'
                : 'border border-border text-muted-foreground hover:bg-muted'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
        <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Emergency donations need immediate attention. As admin, you can cancel problematic ones
          or monitor their status. NGOs receive priority alerts for these.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          ))}
        </div>
      ) : emergencies.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <CheckCircle2 className="w-14 h-14 text-brand-400 mx-auto mb-4" />
          <p className="font-semibold text-foreground text-lg">No emergency requests</p>
          <p className="text-sm text-muted-foreground mt-1">All clear — no active emergencies right now</p>
        </div>
      ) : (
        <div className="space-y-4">
          {emergencies.map((e, i) => (
            <motion.div key={e._id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card border-2 border-red-200 dark:border-red-900/50 rounded-2xl overflow-hidden">
              <div className="bg-red-500 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-bold uppercase tracking-wide">Emergency</span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full ml-1',
                    e.status === 'available'  ? 'bg-white/30 text-white' :
                    e.status === 'claimed'    ? 'bg-blue-900/50 text-blue-200' :
                    e.status === 'delivered'  ? 'bg-green-900/50 text-green-200' :
                    'bg-gray-900/50 text-gray-200')}>
                    {e.status}
                  </span>
                </div>
                <span className="text-white/70 text-xs">{formatTimeAgo(e.createdAt)}</span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">Donor: {getDonorName(e.donor)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{e.quantity} {e.unit}</p>
                    {e.servings && <p className="text-xs text-muted-foreground">~{e.servings} servings</p>}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{e.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {formatAddress(e.address)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    Expires: {new Date(e.expiryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {e.servings && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      ~{e.servings} people
                    </span>
                  )}
                </div>

                {e.status === 'available' && (
                  <button onClick={() => handleCancel(e._id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                    <XCircle className="w-4 h-4" />
                    Cancel Emergency Donation
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
