CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organizer_verified IS DISTINCT FROM OLD.organizer_verified
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change organizer verification';
  END IF;

  IF NEW.account_type IS DISTINCT FROM OLD.account_type
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NOT (
      current_setting('app.allow_profile_mode_switch', true) = 'true'
      AND OLD.account_type = 'person'::public.account_type
      AND NEW.account_type = 'organizer'::public.account_type
      AND NEW.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Only admins can change account_type';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.set_account_mode(_mode public.account_type)
RETURNS public.account_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM set_config('app.allow_profile_mode_switch', 'true', true);

  UPDATE public.profiles
  SET
    active_mode = _mode,
    account_type = CASE
      WHEN _mode = 'organizer'::public.account_type THEN 'organizer'::public.account_type
      ELSE account_type
    END,
    updated_at = now()
  WHERE user_id = _uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN _mode;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_account_mode(public.account_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_account_mode(public.account_type) TO authenticated;