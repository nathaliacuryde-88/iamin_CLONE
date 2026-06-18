
-- ================= BRING LIST TOGGLE =================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS bring_list_enabled boolean NOT NULL DEFAULT false;

-- ================= ARE-YOU-MUTUAL-FRIENDS HELPER =================
CREATE OR REPLACE FUNCTION public.are_mutual_friends(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = _a AND following_id = _b
  ) AND EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = _b AND following_id = _a
  );
$$;

-- ================= PACTS =================
CREATE TABLE IF NOT EXISTS public.event_pacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  proposer_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'sealed' | 'declined' | 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sealed_at timestamptz,
  UNIQUE (event_id, proposer_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_event_pacts_event ON public.event_pacts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_pacts_partner ON public.event_pacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_event_pacts_proposer ON public.event_pacts(proposer_id);

ALTER TABLE public.event_pacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pact participants can view"
  ON public.event_pacts FOR SELECT
  USING (auth.uid() = proposer_id OR auth.uid() = partner_id);

CREATE POLICY "Propose a pact with a mutual friend"
  ON public.event_pacts FOR INSERT
  WITH CHECK (
    auth.uid() = proposer_id
    AND proposer_id <> partner_id
    AND public.are_mutual_friends(proposer_id, partner_id)
  );

CREATE POLICY "Partner can accept/decline; proposer can cancel"
  ON public.event_pacts FOR UPDATE
  USING (auth.uid() = proposer_id OR auth.uid() = partner_id)
  WITH CHECK (auth.uid() = proposer_id OR auth.uid() = partner_id);

CREATE POLICY "Either party can delete"
  ON public.event_pacts FOR DELETE
  USING (auth.uid() = proposer_id OR auth.uid() = partner_id);

CREATE TRIGGER trg_event_pacts_updated
  BEFORE UPDATE ON public.event_pacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- When a pact becomes sealed, atomically RSVP both users 'going'
CREATE OR REPLACE FUNCTION public.seal_pact_rsvps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'sealed' AND (OLD.status IS DISTINCT FROM 'sealed') THEN
    NEW.sealed_at := now();
    INSERT INTO public.attendees (event_id, user_id, status)
    VALUES (NEW.event_id, NEW.proposer_id, 'going')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.attendees (event_id, user_id, status)
    VALUES (NEW.event_id, NEW.partner_id, 'going')
    ON CONFLICT DO NOTHING;
    -- Notify proposer that the pact sealed
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (NEW.proposer_id, NEW.partner_id, 'pact_sealed', NEW.event_id, 'sealed your pact — you''re both going!');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_pacts_seal
  BEFORE UPDATE ON public.event_pacts
  FOR EACH ROW EXECUTE FUNCTION public.seal_pact_rsvps();

-- Notify partner on new pact proposal
CREATE OR REPLACE FUNCTION public.notify_pact_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
  VALUES (NEW.partner_id, NEW.proposer_id, 'pact_proposed', NEW.event_id, 'wants to make a pact: I''ll go if you go');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_pacts_notify
  AFTER INSERT ON public.event_pacts
  FOR EACH ROW EXECUTE FUNCTION public.notify_pact_proposal();

-- ================= LIVE PRESENCE / RADAR =================
-- Lightweight presence rows, one per user per event. Auto-expire via expires_at.
CREATE TABLE IF NOT EXISTS public.live_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'on_the_way', -- 'on_the_way' | 'arrived' | 'left'
  lat double precision,
  lng double precision,
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_presence_event ON public.live_presence(event_id);
CREATE INDEX IF NOT EXISTS idx_live_presence_expires ON public.live_presence(expires_at);

ALTER TABLE public.live_presence ENABLE ROW LEVEL SECURITY;

-- Only fellow attendees see presence rows that haven't expired.
CREATE POLICY "Attendees can view live presence"
  ON public.live_presence FOR SELECT
  USING (
    public.is_event_attendee(event_id, auth.uid())
    AND expires_at > now()
  );

CREATE POLICY "Attendees can broadcast their own presence"
  ON public.live_presence FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_event_attendee(event_id, auth.uid())
  );

CREATE POLICY "Users can update their own presence"
  ON public.live_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can clear their own presence"
  ON public.live_presence FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_pacts;
