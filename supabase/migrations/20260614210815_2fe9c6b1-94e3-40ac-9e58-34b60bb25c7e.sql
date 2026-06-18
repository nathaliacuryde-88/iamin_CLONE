
-- 1) Lock down SECURITY DEFINER functions: revoke anon/public EXECUTE.
REVOKE EXECUTE ON FUNCTION public.notify_invite_suggestion() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_cohost_request_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_cohost_request() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_invite_suggestion_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_exit_poll_comments(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exit_poll_comments(uuid) TO authenticated;

-- 2) Defence-in-depth: enforce bring item field immutability via RLS, not just trigger.
DROP POLICY IF EXISTS "Attendees can claim or unclaim items" ON public.event_bring_items;
CREATE POLICY "Attendees can claim or unclaim items"
ON public.event_bring_items
FOR UPDATE
USING (
  is_event_attendee(event_id, auth.uid())
  AND ((claimed_by IS NULL) OR (claimed_by = auth.uid()))
)
WITH CHECK (
  is_event_attendee(event_id, auth.uid())
  AND ((claimed_by IS NULL) OR (claimed_by = auth.uid()))
);

CREATE POLICY "Bring item immutable fields"
ON public.event_bring_items
AS RESTRICTIVE
FOR UPDATE
USING (true)
WITH CHECK (
  label = (SELECT b.label FROM public.event_bring_items b WHERE b.id = event_bring_items.id)
  AND created_by = (SELECT b.created_by FROM public.event_bring_items b WHERE b.id = event_bring_items.id)
  AND event_id = (SELECT b.event_id FROM public.event_bring_items b WHERE b.id = event_bring_items.id)
);

-- 3) Anonymise exit poll feedback: remove direct host read access; route through RPC
-- (get_exit_poll_comments) which never exposes author_id.
DROP POLICY IF EXISTS "host reads" ON public.event_exit_poll_comments;
