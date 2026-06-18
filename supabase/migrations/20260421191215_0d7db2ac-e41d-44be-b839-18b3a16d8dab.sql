-- 1) Add end_date to events for multi-day events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date date;

-- 2) Availability blocks table
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_user_date
  ON public.availability_blocks (user_id, date);

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- View: own + friends (mutual follows or either-direction follow). Keep simple: viewable by anyone authenticated.
CREATE POLICY "Availability blocks viewable by authenticated"
ON public.availability_blocks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own availability blocks"
ON public.availability_blocks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability blocks"
ON public.availability_blocks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
