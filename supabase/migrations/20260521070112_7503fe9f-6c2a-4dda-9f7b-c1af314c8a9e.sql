
-- 1) Profiles SELECT: split anon/authenticated roles explicitly
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles viewable by anonymous (limited columns via grants)"
  ON public.profiles FOR SELECT TO anon USING (true);

-- 2) event_reactions INSERT must also check viewability
DROP POLICY IF EXISTS "Users can add their own reactions" ON public.event_reactions;
CREATE POLICY "Users can react to events they can view"
  ON public.event_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_view_event(event_id, auth.uid()));

-- 3) Remove overly-broad time-capsule storage INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload time capsule images" ON storage.objects;

-- 4) Realtime channel authorization — require authenticated access
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
  ON realtime.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can send realtime"
  ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true);
