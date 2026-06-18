-- 1. Notify creator when an invitee accepts (going) a non-public event
CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _creator uuid;
  _vis text;
  _was_invited boolean;
BEGIN
  IF NEW.status <> 'going' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'going' THEN
    RETURN NEW;
  END IF;
  SELECT created_by, visibility::text INTO _creator, _vis
  FROM public.events WHERE id = NEW.event_id;
  IF _creator IS NULL OR _creator = NEW.user_id THEN
    RETURN NEW;
  END IF;
  IF _vis = 'public' THEN
    RETURN NEW;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.event_invites
    WHERE event_id = NEW.event_id AND invitee_id = NEW.user_id
  ) INTO _was_invited;
  IF NOT _was_invited THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
  VALUES (_creator, NEW.user_id, 'event_rsvp_accepted', NEW.event_id, 'is in for your event');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_invite_accepted ON public.attendees;
CREATE TRIGGER trg_notify_invite_accepted
AFTER INSERT OR UPDATE OF status ON public.attendees
FOR EACH ROW
EXECUTE FUNCTION public.notify_invite_accepted();

-- 2. Mutual friends can view each other's birthdays
DROP POLICY IF EXISTS "Mutual friends can view birthdays" ON public.user_birthdays;
CREATE POLICY "Mutual friends can view birthdays"
ON public.user_birthdays
FOR SELECT
TO authenticated
USING (public.are_mutual_friends(auth.uid(), user_id));