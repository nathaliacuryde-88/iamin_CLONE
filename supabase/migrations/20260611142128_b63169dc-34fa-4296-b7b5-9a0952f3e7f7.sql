-- Allow any signed-in user to create public events again.
-- Previously, the enforce_public_event_organizer trigger restricted
-- visibility='public' to accounts with account_type='organizer'.
DROP TRIGGER IF EXISTS enforce_public_event_organizer_trigger ON public.events;
DROP TRIGGER IF EXISTS enforce_public_event_organizer ON public.events;
DROP FUNCTION IF EXISTS public.enforce_public_event_organizer();