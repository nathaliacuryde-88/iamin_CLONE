
-- 1. Pact RLS: prevent proposer self-sealing
DROP POLICY IF EXISTS "Partner can accept/decline; proposer can cancel" ON public.event_pacts;

CREATE POLICY "Partner can accept, decline, or seal"
ON public.event_pacts
FOR UPDATE
USING (auth.uid() = partner_id)
WITH CHECK (
  auth.uid() = partner_id
  AND status IN ('sealed', 'declined')
);

CREATE POLICY "Proposer can cancel their own pact"
ON public.event_pacts
FOR UPDATE
USING (auth.uid() = proposer_id)
WITH CHECK (
  auth.uid() = proposer_id
  AND status = 'cancelled'
);

-- 2. Revoke direct execution of internal trigger function
REVOKE EXECUTE ON FUNCTION public.notify_line_walk_in() FROM PUBLIC, anon, authenticated;
