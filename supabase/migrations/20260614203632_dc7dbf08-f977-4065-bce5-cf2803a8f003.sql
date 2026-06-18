
-- 1. Anonymous exit-poll comments
CREATE TABLE public.event_exit_poll_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.event_exit_poll_comments TO authenticated;
GRANT ALL ON public.event_exit_poll_comments TO service_role;
ALTER TABLE public.event_exit_poll_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendees can post anon feedback"
ON public.event_exit_poll_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND public.has_rsvp_going(event_id, auth.uid()));

CREATE POLICY "host reads"
ON public.event_exit_poll_comments FOR SELECT TO authenticated
USING (public.is_event_owner(event_id, auth.uid()));

CREATE INDEX idx_exit_poll_comments_event ON public.event_exit_poll_comments(event_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_exit_poll_comments(_event_id uuid)
RETURNS TABLE(id uuid, content text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.content, c.created_at
  FROM public.event_exit_poll_comments c
  WHERE c.event_id = _event_id
    AND public.is_event_owner(_event_id, auth.uid())
  ORDER BY c.created_at DESC;
$$;

-- 2. Event perks (Convert-the-maybes)
CREATE TABLE public.event_perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  offer_key text NOT NULL,
  sent_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, recipient_id, offer_key)
);
GRANT SELECT, INSERT ON public.event_perks TO authenticated;
GRANT ALL ON public.event_perks TO service_role;
ALTER TABLE public.event_perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "host inserts perks"
ON public.event_perks FOR INSERT TO authenticated
WITH CHECK (sent_by = auth.uid() AND public.is_event_owner(event_id, auth.uid()));

CREATE POLICY "recipient or host reads"
ON public.event_perks FOR SELECT TO authenticated
USING (recipient_id = auth.uid() OR public.is_event_owner(event_id, auth.uid()));

-- 3. Comped flag on attendees
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS comped boolean NOT NULL DEFAULT false;
