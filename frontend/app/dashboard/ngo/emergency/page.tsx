'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, Users, MapPin,
  RefreshCw, HandHeart, Zap,
} from 'lucide-react';
import { cn, formatTimeAgo, formatAddress } from '../../../../lib/utils';
import api from '../../../../lib/api';
import { Donation } from '../../../../types';
import toast from 'react-hot-toast';

export default function NGOEmergencyPage() {
  const [emergencies, setEmergencies] = useState<Donation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [claimingId,  setClaimingId]  = useState<string | null>(null);

  useEffect(() => { fetchEmergencies(); }, []);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donations?isEmergency=true&status=available&limit=20&sortBy=createdAt&sortOrder=desc');
      setEmergencies(res.data.data.donations);
    } catch {
      toast.error('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    try {
      await api.patch(`/donations/${id}/claim`);
      toast.success('Emergency donation claimed! Please assign a volunteer immediately.');
      setEmergencies(prev => prev.filter(e => e._id !== id));
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to claim');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-6 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)',
        }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Emergency Requests</h1>
              <p className="text-white/70 text-sm">
                {emergencies.length} urgent donation{emergencies.length !== 1 ? 's' : ''} need immediate pickup
              </p>
            </div>
          </div>
          <button onClick={fetchEmergencies}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/20 transition-all">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
        <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Emergency donations are time-critical. Once claimed, please assign a volunteer immediately.
          These donations typically expire within 1–2 hours.
        </p>
      </div>

      {/* Emergency Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-red-200 dark:border-red-900/50 rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : emergencies.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mx-auto mb-4">
            <HandHeart className="w-8 h-8 text-brand-500" />
          </div>
          <p className="font-semibold text-foreground text-lg">No emergency requests right now</p>
          <p className="text-sm text-muted-foreground mt-1">Great news! All urgent situations are handled.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {emergencies.map((e, i) => {
            const donor = typeof e.donor === 'object' && e.donor !== null
              ? (e.donor as { organizationName?: string; name?: string })
              : null;
            const donorName = donor?.organizationName || donor?.name || 'Unknown';

            return (
              <motion.div key={e._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-card border-2 border-red-300 dark:border-red-800/60 rounded-2xl overflow-hidden emergency-pulse">
                {/* Red top bar */}
                <div className="bg-red-500 px-5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-bold uppercase tracking-wide">EMERGENCY</span>
                  </div>
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(e.createdAt)}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{e.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">By {donorName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-display font-bold text-foreground">{e.quantity}</p>
                      <p className="text-xs text-muted-foreground">{e.unit}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{e.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Expires in</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        {Math.max(0, Math.floor((new Date(e.expiryTime).getTime() - Date.now()) / 60000))} minutes
                      </p>
                    </div>
                    {e.servings && (
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Feeds</p>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          ~{e.servings} people
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatAddress(e.address)}
                  </div>

                  <button
                    onClick={() => handleClaim(e._id)}
                    disabled={!!claimingId}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60">
                    {claimingId === e._id ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Claiming...</>
                    ) : (
                      <><AlertTriangle className="w-4 h-4" /> Claim Emergency Donation</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
