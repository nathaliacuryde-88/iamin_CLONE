
-- Capacity + ticket fields on events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS ticket_price_cents integer,
  ADD COLUMN IF NOT EXISTS ticket_currency text NOT NULL DEFAULT 'EUR';

-- Pulse stats: aggregate exit-poll ratings exposed ONLY to the event owner.
CREATE OR REPLACE FUNCTION public.get_event_pulse_stats(_event_id uuid)
RETURNS TABLE (
  total_ratings int,
  fire_count int,
  mid_count int,
  flop_count int,
  avg_score numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::int AS total_ratings,
    COUNT(*) FILTER (WHERE rating = 'fire')::int AS fire_count,
    COUNT(*) FILTER (WHERE rating = 'mid')::int AS mid_count,
    COUNT(*) FILTER (WHERE rating = 'flop')::int AS flop_count,
    ROUND(AVG(CASE rating WHEN 'fire' THEN 5 WHEN 'mid' THEN 3 WHEN 'flop' THEN 1 END)::numeric, 2) AS avg_score
  FROM public.event_ratings r
  WHERE r.event_id = _event_id
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = _event_id AND e.created_by = auth.uid()
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_pulse_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_pulse_stats(uuid) TO authenticated;

-- RSVP timeline: per-day counts of going RSVPs for events I own.
CREATE OR REPLACE FUNCTION public.get_event_rsvp_timeline(_event_id uuid)
RETURNS TABLE (
  day date,
  confirms int
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.created_at::date AS day,
    COUNT(*)::int AS confirms
  FROM public.attendees a
  WHERE a.event_id = _event_id
    AND a.status = 'going'
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = _event_id AND e.created_by = auth.uid()
    )
  GROUP BY a.created_at::date
  ORDER BY a.created_at::date;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_rsvp_timeline(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_rsvp_timeline(uuid) TO authenticated;
