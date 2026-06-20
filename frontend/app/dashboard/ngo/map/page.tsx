'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Map, RefreshCw, Layers, UtensilsCrossed,
  AlertTriangle, LocateFixed,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import api from '../../../../lib/api';
import { Donation } from '../../../../types';
import { NGOLocation } from '../../../../components/shared/MapView';
import useAuthStore from '../../../../context/authStore';
import toast from 'react-hot-toast';

const MapView = dynamic(() => import('../../../../components/shared/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/30 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    </div>
  ),
});

type FilterType = 'all' | 'available' | 'emergency';

export default function NGOMapPage() {
  const { user } = useAuthStore();

  const [donations,       setDonations]       = useState<Donation[]>([]);
  const [ngos,            setNGOs]            = useState<NGOLocation[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [filter,          setFilter]          = useState<FilterType>('all');
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [mapCenter,       setMapCenter]       = useState<[number, number]>([20.5937, 78.9629]);
  const [usingMyLocation, setUsingMyLocation] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (filter === 'available') params.status      = 'available';
      if (filter === 'emergency') params.isEmergency = 'true';

      const [donationsRes, ngosRes] = await Promise.all([
        api.get('/donations', { params }),
        api.get('/users/ngos'),
      ]);

      setDonations(donationsRes.data.data.donations);
      setNGOs(ngosRes.data.data.ngos);
    } catch {
      toast.error('Failed to load map data');
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

  // Auto-centre on NGO's saved profile location
  useEffect(() => {
    const coords = user?.location?.coordinates;
    if (
      coords && Array.isArray(coords) && coords.length === 2 &&
      (coords[0] !== 0 || coords[1] !== 0)
    ) {
      setMapCenter([coords[1], coords[0]]); // MongoDB [lng,lat] → Leaflet [lat,lng]
    }
  }, [user]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
    setUsingMyLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        toast.success('Map centred on your location!');
        setUsingMyLocation(false);
      },
      () => { toast.error('Could not get location. Please allow access.'); setUsingMyLocation(false); }
    );
  };

  const availableCount = donations.filter(d => d.status === 'available').length;
  const emergencyCount = donations.filter(d => d.isEmergency).length;
  const inTransitCount = donations.filter(d => d.status === 'in_transit').length;
  const withCoords     = donations.filter(d => {
    const c = d.location?.coordinates;
    return c && c.length === 2 && (c[0] !== 0 || c[1] !== 0) && !isNaN(c[0]);
  }).length;
  const ngosWithCoords = ngos.filter(n => {
    const c = n.location?.coordinates;
    return c && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
  }).length;

  return (
    <div className="space-y-4 h-full">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Donation Map</h1>
            <p className="text-xs text-muted-foreground">
              {withCoords} donation{withCoords !== 1 ? 's' : ''} · {ngosWithCoords} NGO{ngosWithCoords !== 1 ? 's' : ''} on map
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleUseMyLocation} disabled={usingMyLocation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-60">
            {usingMyLocation
              ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              : <LocateFixed className="w-4 h-4" />}
            My Location
          </button>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Available',  value: availableCount, dot: 'bg-brand-500' },
          { label: 'Emergency',  value: emergencyCount, dot: 'bg-red-500' },
          { label: 'In Transit', value: inTransitCount, dot: 'bg-amber-500' },
          { label: 'NGOs',       value: ngosWithCoords, dot: 'bg-sky-500' },
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
        {([
          { key: 'all',       label: 'All Donations', icon: Layers,          color: 'bg-foreground text-background' },
          { key: 'available', label: 'Available',     icon: UtensilsCrossed, color: 'bg-brand-600 text-white' },
          { key: 'emergency', label: 'Emergency',     icon: AlertTriangle,   color: 'bg-red-500 text-white' },
        ] as const).map(btn => {
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
              <p className="text-sm text-muted-foreground">Loading map…</p>
            </div>
          </div>
        ) : (
          <MapView
            donations={donations}
            ngos={ngos}
            selectedId={selectedId}
            onSelect={setSelectedId}
            center={mapCenter}
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
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', item.dot)} />
            {item.label}
          </div>
        ))}
        <span className="ml-auto opacity-50">Only verified locations shown</span>
      </div>

      {/* No-location notice */}
      {!loading && donations.length > 0 && withCoords === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-400">
          📍 No donations with verified locations yet. Hotels need to pin their location or enter a full address when posting.
        </div>
      )}
    </div>
  );
}
