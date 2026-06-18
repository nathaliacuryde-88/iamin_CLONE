import { useCallback, useEffect, useState } from "react";

const KEY = "iamin.userLocation";
const TTL_MS = 24 * 60 * 60 * 1000;

export type UserLocation = { lat: number; lng: number; ts: number };

const read = (): UserLocation | null => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (!parsed?.lat || !parsed?.lng) return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const write = (loc: UserLocation) => {
  try { window.localStorage.setItem(KEY, JSON.stringify(loc)); } catch { /* ignore */ }
};

/** Haversine distance in km. */
export const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * useUserLocation — lazily resolves the user's geolocation, caches it for 24h.
 * Call `request()` from a user gesture to prompt for permission.
 */
export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(() =>
    typeof window === "undefined" ? null : read(),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "error" | "ok">(
    location ? "ok" : "idle",
  );

  // Pick up cached value if it appears later (e.g. after first request).
  useEffect(() => {
    if (location) return;
    const v = read();
    if (v) { setLocation(v); setStatus("ok"); }
  }, [location]);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      return Promise.resolve(null);
    }
    setStatus("loading");
    return new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next: UserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
          write(next);
          setLocation(next);
          setStatus("ok");
          resolve(next);
        },
        (err) => {
          setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
      );
    });
  }, []);

  return { location, status, request };
};
