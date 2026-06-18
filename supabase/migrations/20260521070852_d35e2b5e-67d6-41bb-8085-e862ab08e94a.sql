
-- 1. Prevent profile privilege escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.account_type IS DISTINCT FROM OLD.account_type
      OR NEW.organizer_verified IS DISTINCT FROM OLD.organizer_verified)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change account_type or organizer_verified';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Restrict profile_highlights SELECT to owner or mutual friends
DROP POLICY IF EXISTS "Highlights viewable by authenticated users" ON public.profile_highlights;
CREATE POLICY "Highlights viewable by owner or mutual friends"
ON public.profile_highlights
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.are_mutual_friends(auth.uid(), user_id)
);

-- 3. Scope realtime.messages access by topic
DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;

CREATE POLICY "Users read own or attended event channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.attendees a
    WHERE a.user_id = auth.uid() AND a.event_id::text = realtime.topic()
  )
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.created_by = auth.uid() AND e.id::text = realtime.topic()
  )
);

CREATE POLICY "Users send on own or attended event channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.attendees a
    WHERE a.user_id = auth.uid() AND a.event_id::text = realtime.topic()
  )
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.created_by = auth.uid() AND e.id::text = realtime.topic()
  )
);
