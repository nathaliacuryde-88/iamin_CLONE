import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { useUserLocation, distanceKm } from "@/hooks/useUserLocation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  importance?: number;
  address?: { city?: string; town?: string; village?: string; country?: string };
};

const CityAutocomplete = ({
  value,
  onChange,
  placeholder = "City",
  required = false,
  invalid = false,
}: {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { location } = useUserLocation();
  const { user } = useAuth();
  const [profileCity, setProfileCity] = useState<string | null>(null);

  // Pull profile city once for prefix-bias
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("profiles").select("city").eq("user_id", user.id).maybeSingle();
      if (!cancelled) setProfileCity(((data as any)?.city as string | undefined)?.trim() ?? null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Curated DACH priority list — Stuttgart pinned first.
  const PRIORITY_CITIES = [
    "Stuttgart",
    "Berlin",
    "München",
    "Hamburg",
    "Köln",
    "Frankfurt",
    "Düsseldorf",
    "Leipzig",
    "Wien",
    "Zürich",
  ];

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Bias results to user location with a generous viewbox (~500km)
        let viewboxParam = "";
        if (location) {
          const dLat = 4.5; // ~500km
          const dLng = 4.5 / Math.max(0.1, Math.cos((location.lat * Math.PI) / 180));
          const left = location.lng - dLng;
          const right = location.lng + dLng;
          const top = location.lat + dLat;
          const bottom = location.lat - dLat;
          viewboxParam = `&viewbox=${left},${top},${right},${bottom}&bounded=0`;
        }
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=8&featuretype=city&countrycodes=de,at,ch${viewboxParam}`,
          { headers: { "Accept-Language": "en" } },
        );
        const data: Suggestion[] = await res.json();

        const q = value.trim().toLowerCase();

        // 0) Curated priority entries that prefix-match the query (Stuttgart first).
        const priorityMatches: Suggestion[] = PRIORITY_CITIES
          .filter((c) => c.toLowerCase().startsWith(q))
          .map((c) => ({
            display_name: c,
            lat: "0",
            lon: "0",
            address: { city: c, country: ["Wien"].includes(c) ? "Austria" : c === "Zürich" ? "Switzerland" : "Germany" },
            importance: 999,
          }));

        // Rank: prefix-match on profile city first, then by distance to user, then by importance
        const ranked = [...data].sort((a, b) => {
          const ac = (a.address?.city || a.address?.town || a.address?.village || "").toLowerCase();
          const bc = (b.address?.city || b.address?.town || b.address?.village || "").toLowerCase();

          // 1) Profile-city prefix wins
          if (profileCity) {
            const pc = profileCity.toLowerCase();
            const aPC = pc.startsWith(q) && ac && pc.startsWith(ac);
            const bPC = pc.startsWith(q) && bc && pc.startsWith(bc);
            if (aPC && !bPC) return -1;
            if (bPC && !aPC) return 1;
          }

          // 2) Distance to user location
          if (location) {
            const ad = distanceKm(location, { lat: parseFloat(a.lat), lng: parseFloat(a.lon) });
            const bd = distanceKm(location, { lat: parseFloat(b.lat), lng: parseFloat(b.lon) });
            if (ad !== bd) return ad - bd;
          }

          // 3) Nominatim importance (higher = more notable)
          return (b.importance ?? 0) - (a.importance ?? 0);
        });

        // Merge: priorityMatches first, then nominatim, dedupe by city name.
        const seen = new Set<string>();
        const merged: Suggestion[] = [];
        for (const s of [...priorityMatches, ...ranked]) {
          const key = (s.address?.city || s.address?.town || s.address?.village || s.display_name.split(",")[0]).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(s);
        }

        setSuggestions(merged.slice(0, 6));
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, location, profileCity]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const formatCity = (s: Suggestion) => {
    const a = s.address;
    const city = a?.city || a?.town || a?.village || s.display_name.split(",")[0];
    return a?.country ? `${city}, ${a.country}` : city;
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`pl-9 ${invalid ? "border-destructive ring-1 ring-destructive/30" : ""}`}
        />
        {loading && (
          <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(formatCity(s));
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-2"
            >
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{formatCity(s)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
