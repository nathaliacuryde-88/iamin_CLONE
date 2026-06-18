
-- Fix event-images bucket: restrict to specific file access, not listing
DROP POLICY "Event images are publicly accessible" ON storage.objects;
CREATE POLICY "Event images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Fix time-capsule bucket: restrict to specific file access, not listing
DROP POLICY "Time capsule images are publicly accessible" ON storage.objects;
CREATE POLICY "Time capsule images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'time-capsule' AND auth.role() = 'authenticated');
