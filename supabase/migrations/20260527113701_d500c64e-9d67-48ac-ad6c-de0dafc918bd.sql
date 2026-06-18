DROP POLICY IF EXISTS "Events are viewable based on visibility" ON public.events;
CREATE POLICY "Events are viewable based on visibility"
ON public.events
FOR SELECT
USING (
  created_by = auth.uid()
  OR public.can_view_event(id, auth.uid())
);

DELETE FROM public.events WHERE name IN ('__test_debug','__test_curl3');