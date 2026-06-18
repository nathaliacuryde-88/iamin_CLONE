-- Recreate the SELECT policy on events to explicitly handle 'private'
DROP POLICY IF EXISTS "Events are viewable based on visibility" ON public.events;

CREATE POLICY "Events are viewable based on visibility"
ON public.events
FOR SELECT
USING (
  -- Public events visible to everyone
  visibility = 'public'::event_visibility
  -- Creator always sees their own events (incl. private)
  OR auth.uid() = created_by
  -- Tentative (Ghost): visible to mutual / either-direction friends
  OR (
    visibility = 'tentative'::event_visibility
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = events.created_by)
      OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = events.created_by AND f.following_id = auth.uid())
    )
  )
);