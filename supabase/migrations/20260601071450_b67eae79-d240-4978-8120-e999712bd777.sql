
-- 1) Stripe Connect accounts (one per organizer)
CREATE TABLE public.stripe_accounts (
  user_id uuid PRIMARY KEY,
  stripe_account_id text UNIQUE NOT NULL,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stripe_accounts TO authenticated;
GRANT ALL ON public.stripe_accounts TO service_role;
ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own stripe account" ON public.stripe_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own stripe account" ON public.stripe_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own stripe account" ON public.stripe_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_stripe_accounts_updated_at BEFORE UPDATE ON public.stripe_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'paid',  -- paid | refunded | checked_in
  qr_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer can read own tickets" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR public.is_event_owner(event_id, auth.uid()));
-- inserts/updates happen via service role from edge functions; no policies needed for write paths.
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_buyer ON public.tickets(buyer_id);

-- 3) events: ticket capacity column (price + currency already exist)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_quantity int;

-- 4) Birthday card text styling extras
ALTER TABLE public.birthday_cards
  ADD COLUMN IF NOT EXISTS text_box_color text,
  ADD COLUMN IF NOT EXISTS text_position jsonb;

-- 5) Profile language preference
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
