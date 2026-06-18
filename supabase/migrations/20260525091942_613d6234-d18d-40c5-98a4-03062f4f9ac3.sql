CREATE OR REPLACE FUNCTION public.can_view_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
      AND (
        e.visibility = 'public'
        OR e.created_by = _user_id
        OR public.is_event_attendee(e.id, _user_id)
        OR (
          e.visibility = 'tentative' AND _user_id IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = _user_id AND f.following_id = e.created_by)
            OR EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = e.created_by AND f.following_id = _user_id)
            OR public.is_event_invitee(e.id, _user_id)
          )
        )
        OR (
          e.visibility = 'circle' AND _user_id IS NOT NULL AND (
            public.are_mutual_friends(_user_id, e.created_by) OR public.is_event_invitee(e.id, _user_id)
          )
        )
        OR (
          e.visibility = 'private' AND _user_id IS NOT NULL AND (
            public.is_event_invitee(e.id, _user_id) OR public.are_mutual_friends(_user_id, e.created_by)
          )
        )
      )
  );
$function$;

DROP POLICY IF EXISTS "Events are viewable based on visibility" ON public.events;
CREATE POLICY "Events are viewable based on visibility"
ON public.events
FOR SELECT
USING (public.can_view_event(id, auth.uid()));