
-- 1. availability_blocks.reason
ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS reason text;

-- 2. de-dup notify_new_follower: skip if a friend_request notif from the same sender already exists in last 24h
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  -- Skip if a friend_request notification from the same sender already exists recently
  IF EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.recipient_id = NEW.following_id
      AND n.sender_id = NEW.follower_id
      AND n.type = 'friend_request'
      AND n.created_at > now() - interval '24 hours'
  ) THEN
    RETURN NEW;
  END IF;
  -- Also skip if the reverse friend exists (mutual friends accepted a request — handled by friend_request flow)
  IF EXISTS (
    SELECT 1 FROM public.friend_requests fr
    WHERE ((fr.requester_id = NEW.follower_id AND fr.recipient_id = NEW.following_id)
        OR (fr.requester_id = NEW.following_id AND fr.recipient_id = NEW.follower_id))
      AND fr.status = 'accepted'
      AND fr.updated_at > now() - interval '24 hours'
  ) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (recipient_id, sender_id, type, content)
  VALUES (NEW.following_id, NEW.follower_id, 'new_follower', 'started following you');
  RETURN NEW;
END;
$function$;

-- 3. Cleanup existing duplicates: remove new_follower notifications when a friend_request from same sender exists
DELETE FROM public.notifications n
WHERE n.type = 'new_follower'
  AND EXISTS (
    SELECT 1 FROM public.notifications f
    WHERE f.type = 'friend_request'
      AND f.recipient_id = n.recipient_id
      AND f.sender_id = n.sender_id
  );

-- 4. RPC: get event visibility hint (creator's public profile) even if viewer can't see the event
CREATE OR REPLACE FUNCTION public.get_event_visibility_hint(_event_id uuid)
RETURNS TABLE(creator_id uuid, display_name text, username text, avatar_url text, visibility text, event_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    e.created_by,
    p.display_name,
    p.username,
    p.avatar_url,
    e.visibility::text,
    e.name
  FROM public.events e
  LEFT JOIN public.profiles p ON p.user_id = e.created_by
  WHERE e.id = _event_id;
$$;

-- 5. RPC: get profile highlights for a user that mutual friends can also see (bypasses time_capsule_photos attendee gate)
CREATE OR REPLACE FUNCTION public.get_profile_highlights(_profile_user_id uuid)
RETURNS TABLE(
  highlight_id uuid,
  event_id uuid,
  event_name text,
  event_date date,
  event_image_url text,
  event_description text,
  photo_id uuid,
  photo_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    h.id AS highlight_id,
    e.id AS event_id,
    e.name AS event_name,
    e.date AS event_date,
    e.image_url AS event_image_url,
    e.description AS event_description,
    p.id AS photo_id,
    p.image_url AS photo_url
  FROM public.profile_highlights h
  JOIN public.time_capsule_photos p ON p.id = h.photo_id
  JOIN public.events e ON e.id = h.event_id
  WHERE h.user_id = _profile_user_id
    AND (
      auth.uid() = _profile_user_id
      OR public.are_mutual_friends(auth.uid(), _profile_user_id)
    );
$$;

-- 6. event_collaborators table for co-creators
CREATE TABLE IF NOT EXISTS public.event_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_event_collaborator(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_collaborators
    WHERE event_id = _event_id AND user_id = _user_id
  );
$$;

CREATE POLICY "Collaborators viewable by event viewers"
ON public.event_collaborators FOR SELECT
USING (public.can_view_event(event_id, auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Event owner can add collaborators"
ON public.event_collaborators FOR INSERT
WITH CHECK (auth.uid() = added_by AND public.is_event_owner(event_id, auth.uid()));

CREATE POLICY "Owner or collaborator self can remove"
ON public.event_collaborators FOR DELETE
USING (public.is_event_owner(event_id, auth.uid()) OR auth.uid() = user_id);

-- Update events UPDATE policy to also allow collaborators
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Owner or collaborator can update events"
ON public.events FOR UPDATE
USING (auth.uid() = created_by OR public.is_event_collaborator(id, auth.uid()));
