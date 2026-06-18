
-- Server-side enforcement: only organizer accounts can create public events
CREATE OR REPLACE FUNCTION public.enforce_public_event_organizer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility = 'public' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = NEW.created_by
        AND account_type = 'organizer'
    ) THEN
      RAISE EXCEPTION 'Only organizer accounts can create public events';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_public_event_organizer() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS enforce_public_event_organizer_trg ON public.events;
CREATE TRIGGER enforce_public_event_organizer_trg
  BEFORE INSERT OR UPDATE OF visibility ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_public_event_organizer();

-- Validate source_url scheme to prevent javascript: and other dangerous URIs
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_source_url_scheme;
ALTER TABLE public.events
  ADD CONSTRAINT events_source_url_scheme
  CHECK (source_url IS NULL OR source_url ~* '^https?://');
