-- Event invites: lets a creator grant SELECT access to specific users for ghost/private events.

CREATE TABLE IF NOT EXISTS public.event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, invitee_id)
);

ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

-- Invitee or event owner can see invites for the event
CREATE POLICY "Invites viewable by invitee or event owner"
ON public.event_invites
FOR SELECT
USING (
  auth.uid() = invitee_id
  OR public.is_event_owner(event_id, auth.uid())
);

-- Only the event owner can create invites for their event
CREATE POLICY "Event owner can invite"
ON public.event_invites
FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id
  AND public.is_event_owner(event_id, auth.uid())
);

-- Event owner or the invitee can remove an invite
CREATE POLICY "Owner or invitee can delete invite"
ON public.event_invites
FOR DELETE
USING (
  auth.uid() = invitee_id
  OR public.is_event_owner(event_id, auth.uid())
);

-- Helper: is this user invited to this event?
CREATE OR REPLACE FUNCTION public.is_event_invitee(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_invites
    WHERE event_id = _event_id AND invitee_id = _user_id
  )
$$;

-- Update events SELECT policy: invited users can also view ghost/private events
DROP POLICY IF EXISTS "Events are viewable based on visibility" ON public.events;

CREATE POLICY "Events are viewable based on visibility"
ON public.events
FOR SELECT
USING (
  visibility = 'public'::event_visibility
  OR auth.uid() = created_by
  OR (
    visibility = 'tentative'::event_visibility
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = events.created_by)
      OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = events.created_by AND f.following_id = auth.uid())
      OR public.is_event_invitee(events.id, auth.uid())
    )
  )
  OR (
    visibility = 'private'::event_visibility
    AND auth.uid() IS NOT NULL
    AND public.is_event_invitee(events.id, auth.uid())
  )
);

-- Notify invitee when they're invited
CREATE OR REPLACE FUNCTION public.notify_event_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
  VALUES (NEW.invitee_id, NEW.inviter_id, 'event_invite', NEW.event_id, 'invited you to an event');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_invites_notify ON public.event_invites;
CREATE TRIGGER event_invites_notify
AFTER INSERT ON public.event_invites
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_invite();