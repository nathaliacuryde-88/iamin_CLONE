
CREATE OR REPLACE FUNCTION public.notify_duplicate_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dupe RECORD;
BEGIN
  IF NEW.name IS NULL OR NEW.date IS NULL THEN
    RETURN NEW;
  END IF;
  FOR dupe IN
    SELECT e.id, e.created_by
    FROM public.events e
    WHERE e.id <> NEW.id
      AND e.date = NEW.date
      AND lower(trim(e.name)) = lower(trim(NEW.name))
      AND e.created_by <> NEW.created_by
      AND public.are_mutual_friends(e.created_by, NEW.created_by)
  LOOP
    -- Notify the existing event creator that a friend just added the same thing
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (dupe.created_by, NEW.created_by, 'duplicate_event', NEW.id,
            'added the same event you have — maybe merge plans?');
    -- And notify the new creator about the existing one
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (NEW.created_by, dupe.created_by, 'duplicate_event', dupe.id,
            'a friend already added this event — see theirs');
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_duplicate_event ON public.events;
CREATE TRIGGER trg_notify_duplicate_event
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_duplicate_event();
