-- Event expenses table
CREATE TABLE public.event_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_expenses_event ON public.event_expenses(event_id);

ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;

-- Expense shares table  
CREATE TABLE public.expense_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.event_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_cents INTEGER NOT NULL CHECK (share_cents >= 0),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

CREATE INDEX idx_expense_shares_expense ON public.expense_shares(expense_id);
CREATE INDEX idx_expense_shares_user ON public.expense_shares(user_id);

ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;

-- Helper: is user an attendee of an event
CREATE OR REPLACE FUNCTION public.is_event_attendee(_event_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendees
    WHERE event_id = _event_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND created_by = _user_id
  )
$$;

-- Helper: is user the creator of an event
CREATE OR REPLACE FUNCTION public.is_event_owner(_event_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND created_by = _user_id
  )
$$;

-- RLS for event_expenses
CREATE POLICY "Expenses viewable by event attendees"
ON public.event_expenses FOR SELECT
USING (public.is_event_attendee(event_id, auth.uid()));

CREATE POLICY "Attendees can create expenses"
ON public.event_expenses FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.is_event_attendee(event_id, auth.uid())
);

CREATE POLICY "Creator or payer or owner can update expense"
ON public.event_expenses FOR UPDATE
USING (
  auth.uid() = created_by
  OR auth.uid() = payer_id
  OR public.is_event_owner(event_id, auth.uid())
);

CREATE POLICY "Creator or payer or owner can delete expense"
ON public.event_expenses FOR DELETE
USING (
  auth.uid() = created_by
  OR auth.uid() = payer_id
  OR public.is_event_owner(event_id, auth.uid())
);

-- RLS for expense_shares
CREATE POLICY "Shares viewable by event attendees"
ON public.expense_shares FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_expenses e
    WHERE e.id = expense_id
    AND public.is_event_attendee(e.event_id, auth.uid())
  )
);

CREATE POLICY "Expense creator can insert shares"
ON public.expense_shares FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_expenses e
    WHERE e.id = expense_id
    AND (e.created_by = auth.uid() OR e.payer_id = auth.uid() OR public.is_event_owner(e.event_id, auth.uid()))
  )
);

CREATE POLICY "Share owner or payer can update share (settle)"
ON public.expense_shares FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.event_expenses e
    WHERE e.id = expense_id
    AND (e.payer_id = auth.uid() OR e.created_by = auth.uid() OR public.is_event_owner(e.event_id, auth.uid()))
  )
);

CREATE POLICY "Expense creator/payer/owner can delete shares"
ON public.expense_shares FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.event_expenses e
    WHERE e.id = expense_id
    AND (e.created_by = auth.uid() OR e.payer_id = auth.uid() OR public.is_event_owner(e.event_id, auth.uid()))
  )
);

-- updated_at trigger for event_expenses
CREATE TRIGGER update_event_expenses_updated_at
BEFORE UPDATE ON public.event_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_shares;