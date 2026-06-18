
-- Avatar bucket: keep public file URLs working (served via CDN, not via SELECT),
-- but drop the broad listing policy. Also restrict the other buckets' SELECT to
-- the file owner so listing reveals nothing useful.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Time capsule images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can list their own event images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can list their own time capsule images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'time-capsule' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Revoke EXECUTE from anon/authenticated/public on internal SECURITY DEFINER
-- trigger/helper functions in the public schema. Triggers don't need EXECUTE
-- grants; revoking these closes the API surface.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated;',
      fn.schema_name, fn.proname, fn.args);
  END LOOP;
END $$;

-- Re-grant EXECUTE on the helpers that RLS policies need to be callable by
-- authenticated users (RLS evaluates as the caller, so they need EXECUTE).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_invitee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_has_ended(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_rsvp_going(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.are_mutual_friends(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid, uuid) TO authenticated;
