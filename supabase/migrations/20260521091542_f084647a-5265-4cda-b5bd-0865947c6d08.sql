
-- Line Mode: live queue status for organizer events
CREATE TYPE public.line_status AS ENUM ('walk_in','short_wait','long_wait','closed');

CREATE TABLE public.event_line_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  started_by uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE UNIQUE INDEX event_line_sessions_active_unique
  ON public.event_line_sessions(event_id) WHERE ended_at IS NULL;

CREATE TABLE public.event_line_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.event_line_sessions(id) ON DELETE CASCADE,
  status public.line_status NOT NULL,
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_line_status_event_idx ON public.event_line_status(event_id, created_at DESC);

ALTER TABLE public.event_line_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_line_status ENABLE ROW LEVEL SECURITY;

-- Anyone who can view the event can read line mode state
CREATE POLICY "Line sessions viewable by event viewers"
  ON public.event_line_sessions FOR SELECT
  USING (public.can_view_event(event_id, auth.uid()));

CREATE POLICY "Line status viewable by event viewers"
  ON public.event_line_status FOR SELECT
  USING (public.can_view_event(event_id, auth.uid()));

-- Only the event owner can mutate
CREATE POLICY "Event owner can start sessions"
  ON public.event_line_sessions FOR INSERT
  WITH CHECK (auth.uid() = started_by AND public.is_event_owner(event_id, auth.uid()));

CREATE POLICY "Event owner can end sessions"
  ON public.event_line_sessions FOR UPDATE
  USING (public.is_event_owner(event_id, auth.uid()))
  WITH CHECK (public.is_event_owner(event_id, auth.uid()));

CREATE POLICY "Event owner can insert status"
  ON public.event_line_status FOR INSERT
  WITH CHECK (auth.uid() = created_by AND public.is_event_owner(event_id, auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_line_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_line_status;
ALTER TABLE public.event_line_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.event_line_status REPLICA IDENTITY FULL;

-- Notify attendees on transition TO walk_in
CREATE OR REPLACE FUNCTION public.notify_line_walk_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_status public.line_status;
  ev_name text;
BEGIN
  IF NEW.status <> 'walk_in' THEN
    RETURN NEW;
  END IF;
  SELECT status INTO prev_status
    FROM public.event_line_status
    WHERE event_id = NEW.event_id AND id <> NEW.id
    ORDER BY created_at DESC LIMIT 1;
  IF prev_status = 'walk_in' THEN
    RETURN NEW;
  END IF;
  SELECT name INTO ev_name FROM public.events WHERE id = NEW.event_id;
  INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
  SELECT a.user_id, NEW.created_by, 'line_walk_in', NEW.event_id,
         'Door just cleared — walk in now 🟢'
  FROM public.attendees a
  WHERE a.event_id = NEW.event_id
    AND a.status IN ('going','interested')
    AND a.user_id <> NEW.created_by;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_line_walk_in
AFTER INSERT ON public.event_line_status
FOR EACH ROW EXECUTE FUNCTION public.notify_line_walk_in();
