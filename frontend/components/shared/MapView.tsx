'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Donation, UserRole } from '../../types';
import { formatTimeRemaining, formatAddress, getCategoryIcon } from '../../lib/utils';

export interface NGOLocation {
  _id:               string;
  organizationName?: string;
  name?:             string;
  location?:         { coordinates: [number, number] };
  address?:          { city?: string; state?: string };
}

const isValid = (c?: number[] | null): c is [number, number] =>
  Array.isArray(c) && c.length === 2 &&
  typeof c[0] === 'number' && typeof c[1] === 'number' &&
  !isNaN(c[0]) && !isNaN(c[1]) && !(c[0] === 0 && c[1] === 0);

const circleStyle = (d: Donation): L.CircleMarkerOptions => {
  if (d.isEmergency)
    return { radius: 13, fillColor: '#ef4444', color: '#fff', weight: 3, fillOpacity: 1, opacity: 1 };
  const map: Record<string, L.CircleMarkerOptions> = {
    available:  { radius: 10, fillColor: '#16a34a', color: '#fff', weight: 2.5, fillOpacity: 0.95, opacity: 1 },
    claimed:    { radius: 6,  fillColor: '#2563eb', color: '#fff', weight: 2,   fillOpacity: 0.90, opacity: 1 },
    in_transit: { radius: 10, fillColor: '#d97706', color: '#fff', weight: 2.5, fillOpacity: 0.95, opacity: 1 },
    delivered:  { radius: 6,  fillColor: '#7c3aed', color: '#fff', weight: 2,   fillOpacity: 0.80, opacity: 1 },
  };
  return map[d.status] ?? map['available'];
};

const NGO_STYLE: L.CircleMarkerOptions = {
  radius: 10, fillColor: '#0ea5e9', color: '#fff', weight: 2.5, fillOpacity: 0.88, opacity: 1,
};

const donationPopup = (d: Donation): string => {
  const t  = formatTimeRemaining(d.expiryTime);
  const cs = circleStyle(d);
  const uc = t.urgency === 'critical' ? '#ef4444' : t.urgency === 'warning' ? '#d97706' : '#16a34a';
  const donor =
    typeof d.donor === 'object' && d.donor !== null
      ? (d.donor as { organizationName?: string; name?: string }).organizationName
        || (d.donor as { name?: string }).name || 'Unknown'
      : 'Unknown';
  return `<div style="font-family:sans-serif;min-width:210px;max-width:270px;">
    ${d.isEmergency ? '<div style="background:#ef4444;color:#fff;padding:5px 10px;font-size:11px;font-weight:700;">⚠️ EMERGENCY</div>' : ''}
    <div style="padding:10px;">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
        <div style="width:9px;height:9px;border-radius:50%;background:${cs.fillColor};flex-shrink:0;"></div>
        <p style="font-weight:700;font-size:13px;color:#111;margin:0;">${d.title}</p>
      </div>
      <p style="font-size:11px;color:#666;margin:0 0 8px;">${getCategoryIcon(d.category)} ${d.category.replace('_',' ')} · ${donor}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
        <div style="background:#f9fafb;border-radius:6px;padding:5px 7px;">
          <p style="font-size:10px;color:#999;margin:0 0 1px;">Quantity</p>
          <p style="font-size:12px;font-weight:600;color:#111;margin:0;">${d.quantity} ${d.unit}</p>
        </div>
        <div style="background:#f9fafb;border-radius:6px;padding:5px 7px;">
          <p style="font-size:10px;color:#999;margin:0 0 1px;">Expiry</p>
          <p style="font-size:12px;font-weight:600;color:${uc};margin:0;">⏱ ${t.label}</p>
        </div>
      </div>
      <span style="background:${cs.fillColor}22;color:${cs.fillColor};font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;">
        ${d.status.replace('_',' ')}
      </span>
      ${d.servings ? `<span style="font-size:10px;color:#666;margin-left:5px;">👥 ~${d.servings} servings</span>` : ''}
      <p style="font-size:10px;color:#999;margin:8px 0 0;">📍 ${formatAddress(d.address)}</p>
    </div>
  </div>`;
};

const ngoPopup = (n: NGOLocation): string => {
  const name = n.organizationName || n.name || 'NGO';
  const loc  = [n.address?.city, n.address?.state].filter(Boolean).join(', ');
  return `<div style="font-family:sans-serif;padding:10px;min-width:150px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <div style="width:9px;height:9px;border-radius:50%;background:#0ea5e9;flex-shrink:0;"></div>
      <span style="font-size:10px;font-weight:700;color:#0ea5e9;text-transform:uppercase;">NGO</span>
    </div>
    <p style="font-weight:700;font-size:13px;color:#111;margin:0 0 3px;">🏛️ ${name}</p>
    ${loc ? `<p style="font-size:11px;color:#666;margin:0;">📍 ${loc}</p>` : ''}
  </div>`;
};

interface MapViewProps {
  donations:  Donation[];
  ngos?:      NGOLocation[];
  selectedId: string | null;
  onSelect:   (id: string) => void;
  userRole?:  UserRole;
  center?:    [number, number];
  zoom?:      number;
}

export default function MapView({
  donations,
  ngos = [],
  selectedId,
  onSelect,
  center = [20.5937, 78.9629],
  zoom   = 5,
}: MapViewProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const donRef        = useRef<Map<string, L.CircleMarker>>(new Map());
  const ngoRef        = useRef<Map<string, L.CircleMarker>>(new Map());

  // KEY FIX: only add markers after Leaflet fires whenReady()
  // Without this, circleMarkers are added to an uninitialised canvas
  // and stay permanently invisible even though coordinates are correct.
  const [mapReady, setMapReady] = useState(false);

  // 1. Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center, zoom,
      zoomControl: true,
      renderer:    L.svg(),   // SVG renderer — most reliable for circleMarkers
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // whenReady fires after tile layer + canvas are fully set up
    map.whenReady(() => {
      mapRef.current = map;
      map.invalidateSize();   // force recalculate if container was 0-height on paint
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      donRef.current.clear();
      ngoRef.current.clear();
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fly to new center
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const [lat, lng] = center;
    if (lat !== 20.5937 || lng !== 78.9629) {
      mapRef.current.flyTo([lat, lng], 13, { duration: 1.5 });
    }
  }, [mapReady, center]);

  // 3. Donation markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const live = new Set(donations.map(d => d._id));
    donRef.current.forEach((m, id) => {
      if (!live.has(id)) { m.remove(); donRef.current.delete(id); }
    });

    const pts: [number, number][] = [];

    donations.forEach(d => {
      const raw = d.location?.coordinates;
      if (!isValid(raw)) return;
      const lat = raw[1], lng = raw[0];   // MongoDB [lng,lat] → Leaflet [lat,lng]
      pts.push([lat, lng]);

      const style = circleStyle(d);
      if (donRef.current.has(d._id)) {
        donRef.current.get(d._id)!.setLatLng([lat, lng]).setStyle(style);
      } else {
        const m = L.circleMarker([lat, lng], style)
          .addTo(map)
          .bindPopup(donationPopup(d), { maxWidth: 280 });
        m.on('click', () => onSelect(d._id));
        donRef.current.set(d._id, m);
      }
    });

    if (pts.length === 1) {
      map.setView(pts[0], 13);
    } else if (pts.length > 1) {
      try { map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 13 }); } catch { /* ignore */ }
    }
  }, [mapReady, donations, onSelect]);

  // 4. NGO markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const live = new Set(ngos.map(n => n._id));
    ngoRef.current.forEach((m, id) => {
      if (!live.has(id)) { m.remove(); ngoRef.current.delete(id); }
    });

    ngos.forEach(n => {
      const raw = n.location?.coordinates;
      if (!isValid(raw)) return;
      const lat = raw[1], lng = raw[0];
      if (ngoRef.current.has(n._id)) {
        ngoRef.current.get(n._id)!.setLatLng([lat, lng]);
      } else {
        const m = L.circleMarker([lat, lng], NGO_STYLE)
          .addTo(map).bindPopup(ngoPopup(n), { maxWidth: 220 });
        ngoRef.current.set(n._id, m);
      }
    });
  }, [mapReady, ngos]);

  // 5. Open popup for selected
  useEffect(() => {
    if (!mapReady || !selectedId || !mapRef.current) return;
    const m = donRef.current.get(selectedId);
    if (m) { m.openPopup(); mapRef.current.setView(m.getLatLng(), 13, { animate: true }); }
  }, [mapReady, selectedId]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: 400 }} />;
}