-- Ghost event knocks
CREATE TYPE public.knock_status AS ENUM ('pending', 'revealed', 'ignored');

CREATE TABLE public.event_knocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  knocker_id uuid NOT NULL,
  status public.knock_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, knocker_id)
);

CREATE INDEX idx_event_knocks_event ON public.event_knocks(event_id);
CREATE INDEX idx_event_knocks_knocker ON public.event_knocks(knocker_id);

ALTER TABLE public.event_knocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knocker can view own knocks"
ON public.event_knocks FOR SELECT
USING (auth.uid() = knocker_id);

CREATE POLICY "Host can view knocks on own events"
ON public.event_knocks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = event_knocks.event_id AND e.created_by = auth.uid()
));

CREATE POLICY "Mutual friends can knock on ghost events"
ON public.event_knocks FOR INSERT
WITH CHECK (
  auth.uid() = knocker_id
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_knocks.event_id
      AND e.visibility = 'tentative'::event_visibility
      AND public.are_mutual_friends(auth.uid(), e.created_by)
  )
);

CREATE POLICY "Host can update knock status"
ON public.event_knocks FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = event_knocks.event_id AND e.created_by = auth.uid()
));

CREATE OR REPLACE FUNCTION public.notify_on_event_knock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _host uuid;
BEGIN
  SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (_host, NEW.knocker_id, 'ghost_knock', NEW.event_id, 'knocked on your ghost event');
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'revealed' THEN
      INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
      VALUES (NEW.knocker_id, _host, 'ghost_revealed', NEW.event_id, 'revealed a ghost event to you');
    ELSIF NEW.status = 'ignored' THEN
      INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
      VALUES (NEW.knocker_id, _host, 'ghost_ignored', NEW.event_id, 'didn''t reveal the event');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_knock_notify
AFTER INSERT OR UPDATE ON public.event_knocks
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_event_knock();

CREATE TRIGGER trg_event_knock_updated
BEFORE UPDATE ON public.event_knocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();