-- Add city column to events and profiles for location filtering
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

-- Index for city filter performance
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events (city);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (date);