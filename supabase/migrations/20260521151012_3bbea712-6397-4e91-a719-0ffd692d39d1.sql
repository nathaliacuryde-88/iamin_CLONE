
-- 1. Private birthdays table
CREATE TABLE IF NOT EXISTS public.user_birthdays (
  user_id uuid PRIMARY KEY,
  birthday date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_birthdays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own birthday"
  ON public.user_birthdays FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own birthday"
  ON public.user_birthdays FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own birthday"
  ON public.user_birthdays FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own birthday"
  ON public.user_birthdays FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_birthdays_updated_at
  BEFORE UPDATE ON public.user_birthdays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate existing birthdays
INSERT INTO public.user_birthdays (user_id, birthday)
SELECT user_id, birthday FROM public.profiles
WHERE birthday IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop birthday column from profiles (no longer exposed via authenticated SELECT *)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birthday;

-- 4. Security definer function to fetch mutual friends' birthdays
CREATE OR REPLACE FUNCTION public.get_friend_birthdays()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  birthday date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, ub.birthday
  FROM public.user_birthdays ub
  JOIN public.profiles p ON p.user_id = ub.user_id
  WHERE ub.user_id <> auth.uid()
    AND public.are_mutual_friends(auth.uid(), ub.user_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_friend_birthdays() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_birthdays() TO authenticated;

-- 5. Remove duplicate public-role DELETE policy on time-capsule storage
DROP POLICY IF EXISTS "Users can delete their own time capsule images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder in time-capsule" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in time-capsule" ON storage.objects;
