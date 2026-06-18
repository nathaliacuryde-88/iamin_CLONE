-- 1) Allow multiple people to claim the same bring item
CREATE TABLE IF NOT EXISTS public.event_bring_item_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.event_bring_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bring_claims_item ON public.event_bring_item_claims(item_id);
CREATE INDEX IF NOT EXISTS idx_bring_claims_event ON public.event_bring_item_claims(event_id);

ALTER TABLE public.event_bring_item_claims ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the event can see who's bringing what
CREATE POLICY "Claims viewable to anyone who can view the event"
  ON public.event_bring_item_claims FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id)
  );

-- Only attendees (or owner) can claim, and only for themselves
CREATE POLICY "Attendees can claim items"
  ON public.event_bring_item_claims FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_event_attendee(event_id, auth.uid())
  );

-- Users can unclaim only their own claim
CREATE POLICY "Users can unclaim their own"
  ON public.event_bring_item_claims FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_bring_item_claims;

-- 2) Migrate existing single-claim data into the new table
INSERT INTO public.event_bring_item_claims (item_id, user_id, event_id, created_at)
SELECT id, claimed_by, event_id, COALESCE(updated_at, created_at)
FROM public.event_bring_items
WHERE claimed_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3) Relax SELECT on bring items so non-attendees who can see the event also see the list
DROP POLICY IF EXISTS "Bring items viewable by event attendees" ON public.event_bring_items;
CREATE POLICY "Bring items viewable to anyone who can view the event"
  ON public.event_bring_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id)
  );
