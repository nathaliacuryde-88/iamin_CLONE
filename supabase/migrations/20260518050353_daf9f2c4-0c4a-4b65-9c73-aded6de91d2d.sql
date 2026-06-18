-- Allow mutual friends to view private events (so they can request to join)
DROP POLICY IF EXISTS "Events are viewable based on visibility" ON public.events;

CREATE POLICY "Events are viewable based on visibility"
ON public.events
FOR SELECT
USING (
  (visibility = 'public'::event_visibility)
  OR (auth.uid() = created_by)
  OR (
    (visibility = 'tentative'::event_visibility)
    AND (auth.uid() IS NOT NULL)
    AND (
      EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = auth.uid() AND f.following_id = events.created_by
      )
      OR EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = events.created_by AND f.following_id = auth.uid()
      )
      OR public.is_event_invitee(id, auth.uid())
    )
  )
  OR (
    (visibility = 'circle'::event_visibility)
    AND (auth.uid() IS NOT NULL)
    AND (
      public.are_mutual_friends(auth.uid(), created_by)
      OR public.is_event_invitee(id, auth.uid())
    )
  )
  OR (
    (visibility = 'private'::event_visibility)
    AND (auth.uid() IS NOT NULL)
    AND (
      public.is_event_invitee(id, auth.uid())
      OR public.are_mutual_friends(auth.uid(), created_by)
    )
  )
);

-- Allow knocking on private events too (currently restricted to tentative)
DROP POLICY IF EXISTS "Mutual friends can knock on ghost events" ON public.event_knocks;

CREATE POLICY "Mutual friends can knock on private or ghost events"
ON public.event_knocks
FOR INSERT
WITH CHECK (
  auth.uid() = knocker_id
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_knocks.event_id
      AND e.visibility IN ('tentative'::event_visibility, 'private'::event_visibility)
      AND public.are_mutual_friends(auth.uid(), e.created_by)
      AND NOT public.is_event_invitee(e.id, auth.uid())
  )
);