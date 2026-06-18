-- Account type enum
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('person', 'organizer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'person',
  ADD COLUMN IF NOT EXISTS active_mode public.account_type NOT NULL DEFAULT 'person',
  ADD COLUMN IF NOT EXISTS organizer_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organizer_website text,
  ADD COLUMN IF NOT EXISTS organizer_instagram text,
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Application trail
CREATE TABLE IF NOT EXISTS public.organizer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  website text,
  instagram text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON public.organizer_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit applications"
  ON public.organizer_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications"
  ON public.organizer_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all applications"
  ON public.organizer_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));