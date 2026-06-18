-- Revoke EXECUTE on SECURITY DEFINER helper functions from anon and authenticated roles.
-- These are only meant to be called from RLS policies and triggers, not directly via the API.
REVOKE EXECUTE ON FUNCTION public.handle_friend_request_accepted() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_friend_request() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_owner(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_invitee(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_event_invite() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_friend_requests_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;