
-- 1) profiles: remove anon SELECT, restrict to authenticated
DROP POLICY IF EXISTS "Profiles viewable by anonymous (limited columns via grants)" ON public.profiles;

-- 2) follows: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows viewable by authenticated users"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

-- 3) time-capsule bucket: make private + attendee-scoped SELECT policy
UPDATE storage.buckets SET public = false WHERE id = 'time-capsule';

DROP POLICY IF EXISTS "Time capsule objects viewable by attendees" ON storage.objects;
CREATE POLICY "Time capsule objects viewable by attendees"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'time-capsule'
    AND EXISTS (
      SELECT 1 FROM public.time_capsule_photos p
      WHERE p.image_url LIKE '%' || storage.objects.name
        AND public.is_event_attendee(p.event_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Time capsule uploads by attendees" ON storage.objects;
CREATE POLICY "Time capsule uploads by attendees"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'time-capsule'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Time capsule deletes by owner" ON storage.objects;
CREATE POLICY "Time capsule deletes by owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'time-capsule'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
