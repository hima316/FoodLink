'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Map, RefreshCw, Layers, UtensilsCrossed,
  AlertTriangle, Truck, CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import api from '../../../../lib/api';
import { Donation } from '../../../../types';
import { NGOLocation } from '../../../../components/shared/MapView';

const MapView = dynamic(() => import('../../../../components/shared/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
});

type MapFilter = 'all' | 'available' | 'emergency' | 'in_transit';

export default function AdminMapPage() {
  const [donations,  setDonations]  = useState<Donation[]>([]);
  const [ngos,       setNGOs]       = useState<NGOLocation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<MapFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (filter === 'available')  params.status      = 'available';
      if (filter === 'emergency')  params.isEmergency = 'true';
      if (filter === 'in_transit') params.status      = 'in_transit';

      const [donationsRes, ngosRes] = await Promise.all([
        api.get('/donations', { params }),
        api.get('/users/ngos'),
      ]);

      setDonations(donationsRes.data.data.donations);
      setNGOs(ngosRes.data.data.ngos);
    } catch (e) {
      console.error('Admin map error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const counts = {
    all:        donations.length,
    available:  donations.filter(d => d.status === 'available').length,
    emergency:  donations.filter(d => d.isEmergency).length,
    in_transit: donations.filter(d => d.status === 'in_transit').length,
    delivered:  donations.filter(d => d.status === 'delivered').length,
  };

  const withCoords = donations.filter(d => {
    const c = d.location?.coordinates;
    return c && c.length === 2 && (c[0] !== 0 || c[1] !== 0) && !isNaN(c[0]);
  }).length;

  const ngosWithCoords = ngos.filter(n => {
    const c = n.location?.coordinates;
    return c && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
  }).length;

  const filterBtns: {
    key:   MapFilter;
    label: string;
    icon:  React.ElementType;
    color: string;
  }[] = [
    { key: 'all',        label: 'All',        icon: Layers,          color: 'bg-foreground text-background' },
    { key: 'available',  label: 'Available',  icon: UtensilsCrossed, color: 'bg-brand-600 text-white' },
    { key: 'emergency',  label: 'Emergency',  icon: AlertTriangle,   color: 'bg-red-500 text-white' },
    { key: 'in_transit', label: 'In Transit', icon: Truck,           color: 'bg-amber-500 text-white' },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Map className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Platform Map</h1>
            <p className="text-xs text-muted-foreground">
              {withCoords} donation{withCoords !== 1 ? 's' : ''} · {ngosWithCoords} NGO{ngosWithCoords !== 1 ? 's' : ''} plotted
            </p>
          </div>
        </div>
        <button onClick={() => fetchData(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total',      value: counts.all,        dot: 'bg-gray-400' },
          { label: 'Available',  value: counts.available,  dot: 'bg-brand-500' },
          { label: 'Emergency',  value: counts.emergency,  dot: 'bg-red-500' },
          { label: 'In Transit', value: counts.in_transit, dot: 'bg-amber-500' },
          { label: 'Delivered',  value: counts.delivered,  dot: 'bg-purple-500' },
          { label: 'NGOs',       value: ngosWithCoords,    dot: 'bg-sky-500' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
            <div className={cn('w-2.5 h-2.5 rounded-full', s.dot)} />
            <span className="text-sm font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterBtns.map(btn => {
          const Icon = btn.icon;
          return (
            <button key={btn.key} onClick={() => setFilter(btn.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                filter === btn.key
                  ? btn.color + ' shadow-sm'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}>
              <Icon className="w-3.5 h-3.5" />
              {btn.label}
              <span className="opacity-70">({counts[btn.key]})</span>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
        style={{ height: 'calc(100vh - 22rem)' }}>
        {loading ? (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading platform data…</p>
            </div>
          </div>
        ) : (
          <MapView
            donations={donations}
            ngos={ngos}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {[
          { dot: 'bg-brand-500',  label: 'Available' },
          { dot: 'bg-red-500',    label: 'Emergency' },
          { dot: 'bg-amber-500',  label: 'In Transit' },
          { dot: 'bg-blue-600',   label: 'Claimed' },
          { dot: 'bg-purple-500', label: 'Delivered' },
          { dot: 'bg-sky-500',    label: 'NGO Location' },
          { dot: 'bg-gray-400',   label: 'Expired / Cancelled' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', item.dot)} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
