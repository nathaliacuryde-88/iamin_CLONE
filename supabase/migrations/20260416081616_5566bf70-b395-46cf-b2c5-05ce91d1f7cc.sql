-- Drop existing overly permissive INSERT policies
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload time capsule photos" ON storage.objects;

-- Recreate INSERT policies with ownership checks
CREATE POLICY "Users can upload to own folder in event-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images'
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload to own folder in time-capsule"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'time-capsule'
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add missing UPDATE policy for time-capsule
CREATE POLICY "Users can update own files in time-capsule"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'time-capsule'
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);