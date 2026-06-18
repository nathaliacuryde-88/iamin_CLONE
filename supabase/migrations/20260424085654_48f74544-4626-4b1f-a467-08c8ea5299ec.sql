-- Coach marks seen flag (server-side, follows user across devices)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS coach_seen boolean NOT NULL DEFAULT false;

-- Geolocation columns for events (for distance-based filtering & Nearby tab)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision;

-- Helpful index for "events near me" queries (bbox prefilter)
CREATE INDEX IF NOT EXISTS idx_events_latlng ON public.events (lat, lng);