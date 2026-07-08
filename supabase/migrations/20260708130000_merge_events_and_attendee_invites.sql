-- =========================================================
-- Duplicate-event handling (Phase 3 & 4)
--   Phase 3: canonical event model + merge_events() to fold a duplicate
--            into a primary so RSVPs/invites/memories consolidate.
--   Phase 4: let attendees (not just the owner) invite friends, so people
--            spread the existing event instead of cloning it.
-- =========================================================

-- --- Phase 3: canonical link -------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS canonical_event_id uuid
    REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_canonical
  ON public.events (canonical_event_id)
  WHERE canonical_event_id IS NOT NULL;

-- Fold _duplicate_id into _primary_id. The caller must own (or co-create) the
-- DUPLICATE being absorbed — you can give up your own copy — and must be able
-- to see the primary. Moves attendees/invites/collaborators/bring-items/
-- comments/reactions/photos onto the primary, then points the duplicate at it.
CREATE OR REPLACE FUNCTION public.merge_events(_primary_id uuid, _duplicate_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  owns_dup boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _primary_id = _duplicate_id THEN RAISE EXCEPTION 'cannot merge an event into itself'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = _primary_id) THEN
    RAISE EXCEPTION 'primary event not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = _duplicate_id) THEN
    RAISE EXCEPTION 'duplicate event not found';
  END IF;

  -- Permission: caller owns or co-creates the duplicate.
  owns_dup := EXISTS (SELECT 1 FROM public.events WHERE id = _duplicate_id AND created_by = uid)
           OR EXISTS (SELECT 1 FROM public.event_collaborators WHERE event_id = _duplicate_id AND user_id = uid);
  IF NOT owns_dup THEN
    RAISE EXCEPTION 'you can only merge an event you created';
  END IF;

  -- And must be allowed to see the primary (respects visibility).
  IF NOT public.can_view_event(_primary_id, uid) THEN
    RAISE EXCEPTION 'you cannot merge into an event you cannot see';
  END IF;

  -- Don't chain merges: primary must itself be a canonical (top-level) event.
  IF EXISTS (SELECT 1 FROM public.events WHERE id = _primary_id AND canonical_event_id IS NOT NULL) THEN
    RAISE EXCEPTION 'target has already been merged into another event';
  END IF;

  -- Attendees: add anyone from the duplicate not already on the primary.
  INSERT INTO public.attendees (event_id, user_id, status)
  SELECT _primary_id, d.user_id, d.status
  FROM public.attendees d
  WHERE d.event_id = _duplicate_id
    AND NOT EXISTS (SELECT 1 FROM public.attendees p WHERE p.event_id = _primary_id AND p.user_id = d.user_id);

  -- Invites (unique event_id, invitee_id).
  INSERT INTO public.event_invites (event_id, invitee_id, inviter_id)
  SELECT _primary_id, d.invitee_id, d.inviter_id
  FROM public.event_invites d
  WHERE d.event_id = _duplicate_id
    AND NOT EXISTS (SELECT 1 FROM public.event_invites p WHERE p.event_id = _primary_id AND p.invitee_id = d.invitee_id);

  -- Collaborators (unique event_id, user_id).
  INSERT INTO public.event_collaborators (event_id, user_id, added_by)
  SELECT _primary_id, d.user_id, d.added_by
  FROM public.event_collaborators d
  WHERE d.event_id = _duplicate_id
    AND NOT EXISTS (SELECT 1 FROM public.event_collaborators p WHERE p.event_id = _primary_id AND p.user_id = d.user_id);

  -- Content with no cross-event uniqueness: just re-point to the primary.
  UPDATE public.event_bring_items  SET event_id = _primary_id WHERE event_id = _duplicate_id;
  UPDATE public.comments           SET event_id = _primary_id WHERE event_id = _duplicate_id;
  UPDATE public.time_capsule_photos SET event_id = _primary_id WHERE event_id = _duplicate_id;

  -- Reactions are unique on (event_id, user_id, emoji) — move only non-clashing.
  DELETE FROM public.event_reactions d
  WHERE d.event_id = _duplicate_id
    AND EXISTS (SELECT 1 FROM public.event_reactions p
                WHERE p.event_id = _primary_id AND p.user_id = d.user_id AND p.emoji = d.emoji);
  UPDATE public.event_reactions SET event_id = _primary_id WHERE event_id = _duplicate_id;

  -- Finally, tag the duplicate so feeds/calendar collapse it into the primary.
  UPDATE public.events SET canonical_event_id = _primary_id, updated_at = now()
  WHERE id = _duplicate_id;

  RETURN _primary_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.merge_events(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.merge_events(uuid, uuid) TO authenticated;

-- --- Phase 4: attendees can invite friends ----------------------------------
-- Previously only the event owner could insert invites. Allow anyone already
-- attending the event to invite too, so people spread the event they joined
-- instead of creating a duplicate they can invite to.
DROP POLICY IF EXISTS "Event owner can invite" ON public.event_invites;
DROP POLICY IF EXISTS "Owner or attendee can invite" ON public.event_invites;
CREATE POLICY "Owner or attendee can invite"
ON public.event_invites
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = inviter_id
  AND (
    public.is_event_owner(event_id, auth.uid())
    OR public.is_event_attendee(event_id, auth.uid())
  )
);
