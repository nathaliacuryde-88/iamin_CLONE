
-- =========================================================
-- Helper: can the user view this event (mirrors events SELECT policy)
-- =========================================================
CREATE OR REPLACE FUNCTION public.can_view_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
      AND (
        e.visibility = 'public'
        OR e.created_by = _user_id
        OR (
          e.visibility = 'tentative' AND _user_id IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = _user_id AND f.following_id = e.created_by)
            OR EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = e.created_by AND f.following_id = _user_id)
            OR public.is_event_invitee(e.id, _user_id)
          )
        )
        OR (
          e.visibility = 'circle' AND _user_id IS NOT NULL AND (
            public.are_mutual_friends(_user_id, e.created_by) OR public.is_event_invitee(e.id, _user_id)
          )
        )
        OR (
          e.visibility = 'private' AND _user_id IS NOT NULL AND (
            public.is_event_invitee(e.id, _user_id) OR public.are_mutual_friends(_user_id, e.created_by)
          )
        )
      )
  );
$$;

-- =========================================================
-- Revoke EXECUTE on SECURITY DEFINER helpers from anon
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_event_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_event_invitee(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.event_has_ended(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_rsvp_going(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.are_mutual_friends(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_event(uuid, uuid) FROM anon;

-- =========================================================
-- profiles: hide birthday column from anonymous visitors
-- =========================================================
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, display_name, username, avatar_url, bio, city,
  account_type, active_mode, organizer_instagram, organizer_website,
  organizer_verified, onboarded, coach_seen, created_at, updated_at
) ON public.profiles TO anon;
-- birthday intentionally omitted from anon grant; authenticated still sees full row
GRANT SELECT ON public.profiles TO authenticated;

-- =========================================================
-- availability_blocks: self + mutual friends only
-- =========================================================
DROP POLICY IF EXISTS "Availability blocks viewable by authenticated" ON public.availability_blocks;
CREATE POLICY "Availability blocks viewable by self or mutual friends"
  ON public.availability_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.are_mutual_friends(auth.uid(), user_id));

-- =========================================================
-- attendees: scope SELECT by event visibility; restrict INSERT
-- =========================================================
DROP POLICY IF EXISTS "Attendees are viewable by everyone" ON public.attendees;
CREATE POLICY "Attendees viewable based on event visibility"
  ON public.attendees FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.can_view_event(event_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage their own attendance" ON public.attendees;
CREATE POLICY "Users can RSVP if they can join the event"
  ON public.attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.visibility = 'public')
      OR public.is_event_owner(event_id, auth.uid())
      OR public.is_event_invitee(event_id, auth.uid())
      OR (
        EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = event_id
            AND e.visibility IN ('tentative','circle')
            AND public.are_mutual_friends(auth.uid(), e.created_by)
        )
      )
    )
  );

-- =========================================================
-- comments: scope SELECT and INSERT to event viewers
-- =========================================================
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by people who can view the event"
  ON public.comments FOR SELECT
  USING (public.can_view_event(event_id, auth.uid()));

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users who can view the event can comment"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_view_event(event_id, auth.uid()));

-- =========================================================
-- event_bring_items & claims: attendees only for SELECT
-- =========================================================
DROP POLICY IF EXISTS "Bring items viewable to anyone who can view the event" ON public.event_bring_items;
CREATE POLICY "Bring items viewable by event attendees"
  ON public.event_bring_items FOR SELECT
  TO authenticated
  USING (public.is_event_attendee(event_id, auth.uid()));

DROP POLICY IF EXISTS "Claims viewable to anyone who can view the event" ON public.event_bring_item_claims;
CREATE POLICY "Claims viewable by event attendees"
  ON public.event_bring_item_claims FOR SELECT
  TO authenticated
  USING (public.is_event_attendee(event_id, auth.uid()));

-- =========================================================
-- event_reactions: scope SELECT by event visibility
-- =========================================================
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.event_reactions;
CREATE POLICY "Reactions viewable by people who can view the event"
  ON public.event_reactions FOR SELECT
  USING (public.can_view_event(event_id, auth.uid()));

-- =========================================================
-- time_capsule_photos: attendees only
-- =========================================================
DROP POLICY IF EXISTS "Time capsule photos are viewable by everyone" ON public.time_capsule_photos;
CREATE POLICY "Time capsule photos viewable by attendees"
  ON public.time_capsule_photos FOR SELECT
  TO authenticated
  USING (public.is_event_attendee(event_id, auth.uid()));

DROP POLICY IF EXISTS "Users can upload time capsule photos" ON public.time_capsule_photos;
CREATE POLICY "Attendees can upload time capsule photos"
  ON public.time_capsule_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_event_attendee(event_id, auth.uid()));

-- =========================================================
-- profile_highlights: authenticated only
-- =========================================================
DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON public.profile_highlights;
CREATE POLICY "Highlights viewable by authenticated users"
  ON public.profile_highlights FOR SELECT
  TO authenticated
  USING (true);

-- =========================================================
-- notifications: restrict who can be a direct recipient
-- (triggers are SECURITY DEFINER and bypass RLS)
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can notify connected people"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND recipient_id IS NOT NULL
    AND (
      recipient_id = auth.uid()
      OR public.are_mutual_friends(auth.uid(), recipient_id)
      OR EXISTS (
        SELECT 1 FROM public.attendees a1
        JOIN public.attendees a2 ON a1.event_id = a2.event_id
        WHERE a1.user_id = auth.uid() AND a2.user_id = recipient_id
      )
    )
  );

-- =========================================================
-- Storage: prevent listing of public buckets (URLs still work)
-- =========================================================
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read event-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read time-capsule" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view time capsule" ON storage.objects;
-- (Public buckets serve files via CDN without requiring SELECT policy; removing broad
-- SELECT policies prevents anonymous listing while keeping direct URLs working.)
