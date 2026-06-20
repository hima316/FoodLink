'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, X, Navigation } from 'lucide-react';

// Fix Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom red pin icon for the picked location
const pickedIcon = L.divIcon({
  className:  '',
  iconSize:   [40, 52],
  iconAnchor: [20, 52],
  html: `
    <div style="position:relative;width:40px;height:52px;">
      <div style="
        position:absolute;top:0;left:0;width:40px;height:40px;
        background:#ef4444;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);border:3px solid white;
        box-shadow:0 4px 16px rgba(239,68,68,0.5);
      "></div>
      <div style="
        position:absolute;top:8px;left:8px;width:24px;height:24px;
        background:white;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;line-height:1;
      ">📍</div>
    </div>
  `,
});

// ==========================================
// Props
// ==========================================
interface LocationPickerMapProps {
  /** Called whenever the user picks or clears a location */
  onLocationChange: (coords: { lat: number; lng: number } | null) => void;
  /** Pre-selected coordinates (e.g. restored from form state) */
  initialCoords?: { lat: number; lng: number } | null;
  /** Height of the map container */
  height?: number;
}

// ==========================================
// Component
// ==========================================
export default function LocationPickerMap({
  onLocationChange,
  initialCoords = null,
  height = 320,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    initialCoords
  );

  // ── Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:      initialCoords
        ? [initialCoords.lat, initialCoords.lng]
        : [20.5937, 78.9629],   // Centre of India
      zoom:        initialCoords ? 14 : 5,
      zoomControl: true,
    });

    // OpenStreetMap tiles — free, no key
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // If we already have coords, show marker immediately
    if (initialCoords) {
      markerRef.current = L.marker(
        [initialCoords.lat, initialCoords.lng],
        { icon: pickedIcon, draggable: true }
      ).addTo(map);

      // Dragging the marker also updates state
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        const coords = { lat: pos.lat, lng: pos.lng };
        setPicked(coords);
        onLocationChange(coords);
      });
    }

    // Click anywhere to place / move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng, {
          icon:      pickedIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          const c   = { lat: pos.lat, lng: pos.lng };
          setPicked(c);
          onLocationChange(c);
        });
      }

      setPicked(coords);
      onLocationChange(coords);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current  = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Clear pin
  const handleClear = () => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setPicked(null);
    onLocationChange(null);
  };

  // ── Use browser geolocation to fly to user's position
  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current!.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });

        if (markerRef.current) {
          markerRef.current.setLatLng([coords.lat, coords.lng]);
        } else {
          markerRef.current = L.marker([coords.lat, coords.lng], {
            icon:      pickedIcon,
            draggable: true,
          }).addTo(mapRef.current!);

          markerRef.current.on('dragend', () => {
            const p = markerRef.current!.getLatLng();
            const c = { lat: p.lat, lng: p.lng };
            setPicked(c);
            onLocationChange(c);
          });
        }

        setPicked(coords);
        onLocationChange(coords);
      },
      () => {
        // Permission denied or unavailable — silently ignore
      }
    );
  };

  return (
    <div className="space-y-2">
      {/* ── Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          Click anywhere on the map to drop a pin for the exact pickup location.
          You can also drag the pin.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMyLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
          >
            <Navigation className="w-3 h-3" />
            My Location
          </button>
          {picked && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <X className="w-3 h-3" />
              Clear Pin
            </button>
          )}
        </div>
      </div>

      {/* ── Map container */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-border"
        style={{ height }}
      />

      {/* ── Selected coordinates display */}
      {picked ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/50">
          <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
            Pin set: {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
          </p>
          <span className="ml-auto text-xs text-brand-500">✓ Will be used for map marker</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            No pin set — location will be auto-detected from the address you entered above.
          </p>
        </div>
      )}
    </div>
  );
}
