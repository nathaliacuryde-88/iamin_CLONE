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
      OR is_event_invitee(id, auth.uid())
    )
  )
  OR (
    visibility = 'circle'::event_visibility
    AND auth.uid() IS NOT NULL
    AND (
      are_mutual_friends(auth.uid(), events.created_by)
      OR is_event_invitee(id, auth.uid())
    )
  )
  OR (
    visibility = 'private'::event_visibility
    AND auth.uid() IS NOT NULL
    AND is_event_invitee(id, auth.uid())
  )
);