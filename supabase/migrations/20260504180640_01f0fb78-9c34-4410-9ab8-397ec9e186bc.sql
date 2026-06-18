-- =========================================================
-- 1. EXIT POLL
-- =========================================================

CREATE TYPE public.event_rating AS ENUM ('fire', 'mid', 'flop');

CREATE TABLE public.event_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating public.event_rating NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_ratings_event ON public.event_ratings(event_id);
CREATE INDEX idx_event_ratings_user ON public.event_ratings(user_id);

ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;

-- Helper: did the user RSVP "going" to this event?
CREATE OR REPLACE FUNCTION public.has_rsvp_going(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendees
    WHERE event_id = _event_id AND user_id = _user_id AND status = 'going'
  )
$$;

-- Helper: has the event ended? (date in the past, or today)
CREATE OR REPLACE FUNCTION public.event_has_ended(_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id
      AND date IS NOT NULL
      AND (
        (date::timestamp + COALESCE(time, '00:00'::time)) < now()
      )
  )
$$;

-- Aggregates are shown anonymously, so detail rows must stay private.
-- We expose ONLY through views below; no row-level SELECT for end users.
CREATE POLICY "Users can submit a rating for past events they attended"
  ON public.event_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_rsvp_going(event_id, auth.uid())
    AND public.event_has_ended(event_id)
  );

CREATE POLICY "Users can update their own rating within 7 days"
  ON public.event_ratings FOR UPDATE
  USING (
    auth.uid() = user_id
    AND created_at > (now() - interval '7 days')
  );

CREATE POLICY "Users can delete their own rating within 7 days"
  ON public.event_ratings FOR DELETE
  USING (
    auth.uid() = user_id
    AND created_at > (now() - interval '7 days')
  );

CREATE POLICY "Users can read their own rating"
  ON public.event_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_event_ratings_updated_at
BEFORE UPDATE ON public.event_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregate per-event score (anyone can read)
CREATE OR REPLACE VIEW public.event_score_summary
WITH (security_invoker = true) AS
SELECT
  event_id,
  COUNT(*)::int AS total_ratings,
  COUNT(*) FILTER (WHERE rating = 'fire')::int AS fire_count,
  COUNT(*) FILTER (WHERE rating = 'mid')::int AS mid_count,
  COUNT(*) FILTER (WHERE rating = 'flop')::int AS flop_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'fire') / NULLIF(COUNT(*), 0))::int AS fire_pct
FROM public.event_ratings
GROUP BY event_id;

GRANT SELECT ON public.event_score_summary TO anon, authenticated;

-- Aggregate per-creator track record (anyone can read)
CREATE OR REPLACE VIEW public.creator_scores
WITH (security_invoker = true) AS
SELECT
  e.created_by AS user_id,
  COUNT(DISTINCT r.event_id)::int AS events_rated,
  COUNT(r.id)::int AS total_ratings,
  COUNT(r.id) FILTER (WHERE r.rating = 'fire')::int AS fire_count,
  ROUND(100.0 * COUNT(r.id) FILTER (WHERE r.rating = 'fire') / NULLIF(COUNT(r.id), 0))::int AS fire_pct
FROM public.events e
JOIN public.event_ratings r ON r.event_id = e.id
GROUP BY e.created_by;

GRANT SELECT ON public.creator_scores TO anon, authenticated;

-- =========================================================
-- 2. BRING WHAT
-- =========================================================

CREATE TABLE public.event_bring_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  label text NOT NULL,
  claimed_by uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bring_items_event ON public.event_bring_items(event_id);

ALTER TABLE public.event_bring_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bring items viewable by event attendees"
  ON public.event_bring_items FOR SELECT
  USING (public.is_event_attendee(event_id, auth.uid()));

CREATE POLICY "Attendees can add bring items"
  ON public.event_bring_items FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_event_attendee(event_id, auth.uid())
  );

-- Anyone viewing the list (attendee) can claim/unclaim, but only as themselves.
-- This means new claimed_by is either NULL (unclaim) or auth.uid() (claim self).
-- We also allow it only when the current claim is NULL or auth.uid() (no stealing).
CREATE POLICY "Attendees can claim or unclaim items"
  ON public.event_bring_items FOR UPDATE
  USING (
    public.is_event_attendee(event_id, auth.uid())
    AND (claimed_by IS NULL OR claimed_by = auth.uid())
  )
  WITH CHECK (
    public.is_event_attendee(event_id, auth.uid())
    AND (claimed_by IS NULL OR claimed_by = auth.uid())
  );

CREATE POLICY "Creator or event owner can delete items"
  ON public.event_bring_items FOR DELETE
  USING (
    auth.uid() = created_by
    OR public.is_event_owner(event_id, auth.uid())
  );

CREATE TRIGGER trg_bring_items_updated_at
BEFORE UPDATE ON public.event_bring_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_bring_items;
ALTER TABLE public.event_bring_items REPLICA IDENTITY FULL;