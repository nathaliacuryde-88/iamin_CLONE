
CREATE TABLE IF NOT EXISTS public.user_payment_handles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_handle text,
  revolut_handle text,
  n26_handle text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_payment_handles TO authenticated;
GRANT ALL ON public.user_payment_handles TO service_role;
ALTER TABLE public.user_payment_handles ENABLE ROW LEVEL SECURITY;

INSERT INTO public.user_payment_handles (user_id, paypal_handle, revolut_handle, n26_handle)
SELECT user_id, paypal_handle, revolut_handle, n26_handle
FROM public.profiles
WHERE paypal_handle IS NOT NULL OR revolut_handle IS NOT NULL OR n26_handle IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

DROP POLICY IF EXISTS "Owner can manage own payment handles" ON public.user_payment_handles;
CREATE POLICY "Owner can manage own payment handles"
  ON public.user_payment_handles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Mutual friends can read payment handles" ON public.user_payment_handles;
CREATE POLICY "Mutual friends can read payment handles"
  ON public.user_payment_handles FOR SELECT TO authenticated
  USING (public.are_mutual_friends(auth.uid(), user_id));

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS paypal_handle,
  DROP COLUMN IF EXISTS revolut_handle,
  DROP COLUMN IF EXISTS n26_handle;

DROP POLICY IF EXISTS "Time capsule photos viewable by attendees" ON public.time_capsule_photos;
CREATE POLICY "Time capsule photos viewable by attendees after event"
  ON public.time_capsule_photos FOR SELECT TO authenticated
  USING (
    public.is_event_attendee(event_id, auth.uid())
    AND (auth.uid() = user_id OR public.event_has_ended(event_id))
  );

CREATE OR REPLACE FUNCTION public.guard_bring_item_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() = OLD.created_by OR public.is_event_owner(OLD.event_id, auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.label IS DISTINCT FROM OLD.label
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.event_id IS DISTINCT FROM OLD.event_id THEN
    RAISE EXCEPTION 'Only the item creator or event owner can change this field';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_bring_item_update ON public.event_bring_items;
CREATE TRIGGER guard_bring_item_update
  BEFORE UPDATE ON public.event_bring_items
  FOR EACH ROW EXECUTE FUNCTION public.guard_bring_item_update();

DROP POLICY IF EXISTS "Block client ticket inserts" ON public.tickets;
CREATE POLICY "Block client ticket inserts" ON public.tickets
  FOR INSERT TO authenticated, anon WITH CHECK (false);
DROP POLICY IF EXISTS "Block client ticket updates" ON public.tickets;
CREATE POLICY "Block client ticket updates" ON public.tickets
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "Block client ticket deletes" ON public.tickets;
CREATE POLICY "Block client ticket deletes" ON public.tickets
  FOR DELETE TO authenticated, anon USING (false);

REVOKE EXECUTE ON FUNCTION public.are_mutual_friends(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_event(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_empty_capsules() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_has_ended(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_event_pulse_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_event_rsvp_timeline(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_event_visibility_hint(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_friend_birthdays() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_profile_highlights(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_rsvp_going(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_collaborator(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_invitee(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_owner(uuid, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.are_mutual_friends(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_has_ended(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_pulse_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_rsvp_timeline(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_visibility_hint(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_birthdays() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_highlights(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_rsvp_going(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_collaborator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_invitee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_owner(uuid, uuid) TO authenticated;
