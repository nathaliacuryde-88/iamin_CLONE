
-- Explicit SELECT policy on event_exit_poll_comments scoped to event owner
CREATE POLICY "Event owners can read exit poll comments"
ON public.event_exit_poll_comments
FOR SELECT
TO authenticated
USING (public.is_event_owner(event_id, auth.uid()));

-- Explicit restrictive deny policies on user_roles for INSERT/UPDATE/DELETE
-- Only service_role (which bypasses RLS) or admins via SECURITY DEFINER functions can mutate
CREATE POLICY "Deny all client inserts on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny all client updates on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all client deletes on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);
