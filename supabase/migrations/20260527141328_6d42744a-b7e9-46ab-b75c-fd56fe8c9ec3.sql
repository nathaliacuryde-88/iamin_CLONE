-- Payment handles on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paypal_handle text,
  ADD COLUMN IF NOT EXISTS n26_handle text,
  ADD COLUMN IF NOT EXISTS revolut_handle text;

-- Attendee-driven line voting
CREATE TABLE IF NOT EXISTS public.event_line_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status public.line_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_line_votes TO authenticated;
GRANT ALL ON public.event_line_votes TO service_role;

ALTER TABLE public.event_line_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Line votes viewable by event viewers"
  ON public.event_line_votes FOR SELECT TO authenticated
  USING (public.can_view_event(event_id, auth.uid()));

CREATE POLICY "Attendees can cast their own line vote"
  ON public.event_line_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_event_attendee(event_id, auth.uid()));

CREATE POLICY "Attendees can update their own line vote"
  ON public.event_line_votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_event_attendee(event_id, auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_event_attendee(event_id, auth.uid()));

CREATE POLICY "Users can clear their own line vote"
  ON public.event_line_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_event_line_votes_updated_at
  BEFORE UPDATE ON public.event_line_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();