import https from 'https';

export interface GeocodedLocation {
  lat: number;
  lng: number;
}

/**
 * Geocode an address using Nominatim (OpenStreetMap) — free, no API key.
 * ALWAYS returns null on any failure — never throws.
 * Donation saves regardless of geocoding result.
 */
export const geocodeAddress = async (address: {
  street?:  string;
  city?:    string;
  state?:   string;
  country?: string;
  zipCode?: string;
}): Promise<GeocodedLocation | null> => {
  try {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country || 'India',
    ].filter(Boolean);

    // Need at least city to geocode meaningfully
    if (!address.city) return null;

    const query = encodeURIComponent(parts.join(', '));
    const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const data = await fetchWithTimeout(url, 3000); // 3 second max
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
  } catch {
    // Never propagate — geocoding is best-effort only
    return null;
  }
};

/**
 * HTTP GET with a hard timeout.
 * Rejects after `ms` milliseconds.
 */
const fetchWithTimeout = (url: string, ms: number): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'FoodLink/1.0',
        'Accept':     'application/json',
      },
    }, (res) => {
      let raw = '';
      res.on('data',  (c: string) => { raw += c; });
      res.on('end',   () => {
        try   { resolve(JSON.parse(raw)); }
        catch { resolve(null); }   // Bad JSON → return null, not throw
      });
      res.on('error', () => resolve(null));
    });

    req.on('error', () => resolve(null));   // Network error → null

    // Hard timeout — destroy socket after ms milliseconds
    req.setTimeout(ms, () => {
      req.destroy();
      resolve(null);   // Timeout → null, not reject
    });
  });
};