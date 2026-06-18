import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useFeedFilters, FeedFilters } from "@/hooks/useFeedFilters";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import IOSDateTimePicker from "@/components/IOSDateTimePicker";
import CityAutocomplete from "@/components/CityAutocomplete";

const VIBE_OPTIONS = [
  { label: "music", emoji: "🎵" },
  { label: "party", emoji: "🎉" },
  { label: "festival", emoji: "🎪" },
  { label: "birthday", emoji: "🎂" },
  { label: "art", emoji: "🎨" },
  { label: "food", emoji: "🍽️" },
  { label: "brunch", emoji: "🥂" },
  { label: "cinema", emoji: "🎬" },
  { label: "sports", emoji: "⚡" },
  { label: "street markets", emoji: "🛍️" },
];

interface Props {
  liveCount?: number;
  getLiveCount?: (filters: FeedFilters) => number;
}

/**
 * Full-screen filter page. Portaled to <body> so it lives above everything,
 * and pairs with chromeHidden state in FeedFilters context to slide the
 * top header & bottom nav out of view.
 */
const FilterSheet = ({ liveCount, getLiveCount }: Props) => {
  const { filters, setFilters, showFilters, setShowFilters, reset } = useFeedFilters();
  const { location, status, request } = useUserLocation();
  const { user } = useAuth();
  const haptic = useHaptics();
  const [draft, setDraft] = useState<FeedFilters>(filters);

  useEffect(() => { if (showFilters) setDraft(filters); }, [showFilters, filters]);

  useEffect(() => {
    if (showFilters && !location && status === "idle") request();
  }, [showFilters, location, status, request]);

  // Auto-prefill city when filter opens and city is empty.
  // 1) try the user's profile city; 2) fall back to reverse-geocoding their location.
  useEffect(() => {
    if (!showFilters) return;
    if (filters.city.trim()) return; // user already set one
    let cancelled = false;
    (async () => {
      // 1) profile city
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .maybeSingle();
        const pCity = (data as any)?.city as string | undefined;
        if (!cancelled && pCity?.trim()) {
          setDraft((d) => (d.city ? d : { ...d, city: pCity }));
          return;
        }
      }
      // 2) reverse-geocode current location
      if (location) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const j = await res.json();
          const a = j?.address ?? {};
          const city = a.city || a.town || a.village || a.county;
          const country = a.country;
          const label = city ? (country ? `${city}, ${country}` : city) : null;
          if (!cancelled && label) setDraft((d) => (d.city ? d : { ...d, city: label }));
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, [showFilters, filters.city, user, location]);

  const apply = () => {
    haptic("medium");
    setFilters(draft);
    setShowFilters(false);
  };
  const close = () => { haptic("light"); setShowFilters(false); };
  const resetAll = () => {
    haptic("light");
    reset();
    setDraft({ city: "", vibes: [], fromDate: "", toDate: "", minFriends: 0 });
  };

  const toggleVibe = (vibe: string) => {
    haptic("selection");
    setDraft((d) => ({
      ...d,
      vibes: d.vibes.includes(vibe) ? d.vibes.filter((v) => v !== vibe) : [...d.vibes, vibe],
    }));
  };

  const cityLabel = useMemo(() => {
    if (!draft.city.trim()) return "Any city";
    return draft.city;
  }, [draft.city]);
  const draftCount = useMemo(() => getLiveCount?.(draft) ?? liveCount ?? 0, [draft, getLiveCount, liveCount]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {showFilters && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-background"
            onClick={close}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed inset-0 z-[9999] bg-background flex flex-col"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/50 shrink-0">
              <h2 className="text-lg font-bold tracking-tight">Filter</h2>
              <button
                onClick={close}
                aria-label="Close filters"
                className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 max-w-lg w-full mx-auto">
              {/* City — replaces distance slider; location access still requested below for nearby fallback */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">City</h3>
                  <span className="text-xs font-semibold text-primary">{cityLabel}</span>
                </div>
                <CityAutocomplete
                  value={draft.city}
                  onChange={(c) => setDraft({ ...draft, city: c })}
                  placeholder="Type a city…"
                />
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => request()}
                    className="text-[11px] text-primary underline"
                  >
                    {status === "ok" ? "Location enabled" : "Use my current location"}
                  </button>
                  {status === "loading" && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  {status === "ok" && location && <MapPin className="h-3 w-3 text-primary" />}
                </div>
                {status === "denied" && (
                  <p className="text-[11px] text-destructive mt-2">
                    Location access denied. Type a city above to filter.
                  </p>
                )}
              </section>

              {/* Vibes */}
              <section>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
                  Vibes <span className="text-muted-foreground/60 font-normal normal-case">(pick any)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {VIBE_OPTIONS.map((v) => {
                    const active = draft.vibes.includes(v.label);
                    return (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => toggleVibe(v.label)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          active
                            ? "bg-primary text-primary-foreground border-primary glow-sm"
                            : "bg-secondary/60 text-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="mr-1">{v.emoji}</span>
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Friends */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Friends going</h3>
                  <span className="text-xs font-semibold text-primary">
                    {draft.minFriends === 0 ? "Any" : `${draft.minFriends}+`}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={[draft.minFriends]}
                  onValueChange={(v) => setDraft({ ...draft, minFriends: v[0] })}
                />
              </section>

              {/* Date range — uses same iOS picker as event creation */}
              <section>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Date range</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">From</label>
                    <IOSDateTimePicker
                      mode="date"
                      value={draft.fromDate}
                      onChange={(v) => setDraft({ ...draft, fromDate: v })}
                      label="FROM DATE"
                      placeholder="From"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">To</label>
                    <IOSDateTimePicker
                      mode="date"
                      value={draft.toDate}
                      onChange={(v) => setDraft({ ...draft, toDate: v })}
                      label="TO DATE"
                      placeholder="To"
                      min={draft.fromDate || undefined}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Sticky bottom bar */}
            <div
              className="border-t border-border/50 px-5 py-3 flex items-center gap-2 bg-background/95 backdrop-blur-md shrink-0"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <Button variant="outline" onClick={resetAll} className="flex-1 h-11">
                Reset
              </Button>
              <Button
                onClick={apply}
                className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-primary-foreground glow-sm"
              >
                Show {draftCount} events
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default FilterSheet;
