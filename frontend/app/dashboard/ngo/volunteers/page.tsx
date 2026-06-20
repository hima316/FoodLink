'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Star, Truck, Phone, MapPin, RefreshCw, Shield } from 'lucide-react';
import { cn, getInitials } from '../../../../lib/utils';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';

interface Volunteer {
  _id:          string;
  name:         string;
  phone?:       string;
  rating?:      number;
  totalPickups?: number;
  isVerified:   boolean;
  address?: { city?: string; state?: string };
  location?: { coordinates: [number, number] };
}

export default function NGOVolunteersPage() {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [assigning,  setAssigning]  = useState<string | null>(null);

  useEffect(() => { fetchVolunteers(); }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/volunteers');
      setVolunteers(res.data.data.volunteers);
    } catch {
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating = 0) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s}
          className={cn('w-3.5 h-3.5', s <= Math.round(rating)
            ? 'fill-amber-400 text-amber-400'
            : 'text-muted-foreground/30')} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Volunteers</h1>
            <p className="text-xs text-muted-foreground">{volunteers.length} active volunteers available</p>
          </div>
        </div>
        <button onClick={fetchVolunteers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex gap-3">
                <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : volunteers.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Users className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">No volunteers yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Volunteers will appear here once they register</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((v, i) => (
            <motion.div key={v._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-card-hover transition-all">

              {/* Avatar + name */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(v.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground truncate">{v.name}</p>
                    {v.isVerified && <Shield className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
                  </div>
                  {v.rating !== undefined && renderStars(v.rating)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{v.totalPickups ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pickups</p>
                </div>
                <div className="bg-brand-50 dark:bg-brand-950/30 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {v.rating?.toFixed(1) ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              {/* Location */}
              {v.address?.city && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{[v.address.city, v.address.state].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Phone */}
              {v.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{v.phone}</span>
                </div>
              )}

              {/* Assign button */}
             <button
               onClick={() => router.push('/dashboard/ngo/claimed')}
               className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all">
              <Truck className="w-4 h-4" />
              Go to Claimed Donations
            </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}