
-- 1. Attach missing triggers
DROP TRIGGER IF EXISTS guard_bring_item_update_trg ON public.event_bring_items;
CREATE TRIGGER guard_bring_item_update_trg
BEFORE UPDATE ON public.event_bring_items
FOR EACH ROW EXECUTE FUNCTION public.guard_bring_item_update();

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Tighten time-capsule storage SELECT policy with event_has_ended gate
DROP POLICY IF EXISTS "Time capsule objects viewable by attendees" ON storage.objects;
CREATE POLICY "Time capsule objects viewable by attendees"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'time-capsule'
  AND EXISTS (
    SELECT 1 FROM public.time_capsule_photos p
    WHERE (p.image_url = objects.name OR p.image_url LIKE ('%/time-capsule/' || objects.name || '%'))
      AND public.is_event_attendee(p.event_id, auth.uid())
      AND (p.user_id = auth.uid() OR public.event_has_ended(p.event_id))
  )
);

-- 3. Revoke anon EXECUTE on all SECURITY DEFINER public functions
REVOKE EXECUTE ON FUNCTION public.guard_bring_item_update() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_birthday_card() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_invite_accepted() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_follower() FROM PUBLIC, anon;
