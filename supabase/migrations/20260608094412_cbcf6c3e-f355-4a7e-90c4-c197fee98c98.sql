
-- 1. Create user_preferences table
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarded boolean NOT NULL DEFAULT false,
  coach_seen boolean NOT NULL DEFAULT false,
  language text,
  active_mode public.account_type NOT NULL DEFAULT 'person'::public.account_type,
  show_dna_badge boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Backfill from profiles
INSERT INTO public.user_preferences (user_id, onboarded, coach_seen, language, active_mode, show_dna_badge)
SELECT
  user_id,
  COALESCE(onboarded, false),
  COALESCE(coach_seen, false),
  language,
  COALESCE(active_mode, 'person'::public.account_type),
  COALESCE(show_dna_badge, true)
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update handle_new_user to also create preferences row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 4. Rewrite set_account_mode to write to user_preferences (and keep profiles.account_type bump for organizer)
CREATE OR REPLACE FUNCTION public.set_account_mode(_mode public.account_type)
RETURNS public.account_type
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_preferences (user_id, active_mode)
  VALUES (_uid, _mode)
  ON CONFLICT (user_id) DO UPDATE SET active_mode = EXCLUDED.active_mode, updated_at = now();

  IF _mode = 'organizer'::public.account_type THEN
    PERFORM set_config('app.allow_profile_mode_switch', 'true', true);
    UPDATE public.profiles
    SET account_type = 'organizer'::public.account_type,
        updated_at = now()
    WHERE user_id = _uid
      AND account_type IS DISTINCT FROM 'organizer'::public.account_type;
  END IF;

  RETURN _mode;
END;
$function$;

-- 5. Drop the now-migrated columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS onboarded,
  DROP COLUMN IF EXISTS coach_seen,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS active_mode,
  DROP COLUMN IF EXISTS show_dna_badge;
