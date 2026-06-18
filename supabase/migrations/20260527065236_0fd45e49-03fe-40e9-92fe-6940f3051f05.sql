
CREATE TYPE public.user_status AS ENUM ('available', 'not_tonight', 'travelling', 'low_energy');

CREATE TABLE public.user_statuses (
  user_id uuid PRIMARY KEY,
  status public.user_status NOT NULL,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_statuses TO authenticated;
GRANT ALL ON public.user_statuses TO service_role;

ALTER TABLE public.user_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status viewable by self or mutual friends"
  ON public.user_statuses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.are_mutual_friends(auth.uid(), user_id));

CREATE POLICY "Users can insert own status"
  ON public.user_statuses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status"
  ON public.user_statuses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own status"
  ON public.user_statuses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_statuses_updated_at
  BEFORE UPDATE ON public.user_statuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
