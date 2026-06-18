-- Event creators must be able to add their own RSVP row right after creating any event type.
DROP POLICY IF EXISTS "Users can RSVP if they can join the event" ON public.attendees;
CREATE POLICY "Users can RSVP if they can join the event"
ON public.attendees
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_event_owner(event_id, auth.uid())
    OR public.is_event_invitee(event_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = attendees.event_id
        AND e.visibility = 'public'::public.event_visibility
    )
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = attendees.event_id
        AND e.visibility IN ('tentative'::public.event_visibility, 'circle'::public.event_visibility)
        AND public.are_mutual_friends(auth.uid(), e.created_by)
    )
  )
);

-- Birthday card custom background + Instagram-style readable text options.
ALTER TABLE public.birthday_cards
  ADD COLUMN IF NOT EXISTS background_image_url text,
  ADD COLUMN IF NOT EXISTS text_box_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS text_box_style text NOT NULL DEFAULT 'none';

-- Birthday-card background images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-cards', 'birthday-cards', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Birthday card upload own folder" ON storage.objects;
CREATE POLICY "Birthday card upload own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'birthday-cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Birthday card images viewable by sender or recipient" ON storage.objects;
CREATE POLICY "Birthday card images viewable by sender or recipient"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'birthday-cards'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.birthday_cards bc
      WHERE bc.background_image_url = storage.objects.name
        AND bc.recipient_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Birthday card delete own folder" ON storage.objects;
CREATE POLICY "Birthday card delete own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'birthday-cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Repair time-capsule storage access for private bucket files stored as raw paths or legacy public URLs.
DROP POLICY IF EXISTS "Time capsule objects viewable by attendees" ON storage.objects;
CREATE POLICY "Time capsule objects viewable by attendees"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'time-capsule'
  AND EXISTS (
    SELECT 1
    FROM public.time_capsule_photos p
    WHERE (
      p.image_url = storage.objects.name
      OR p.image_url LIKE ('%/time-capsule/' || storage.objects.name || '%')
    )
    AND public.is_event_attendee(p.event_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Time capsule uploads by attendees" ON storage.objects;
CREATE POLICY "Time capsule uploads by attendees"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'time-capsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Time capsule deletes by owner" ON storage.objects;
CREATE POLICY "Time capsule deletes by owner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'time-capsule'
  AND auth.uid()::text = (storage.foldername(name))[1]
);