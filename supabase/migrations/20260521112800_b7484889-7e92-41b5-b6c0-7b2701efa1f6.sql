-- Allow everyone to create public events for now (organizer-only restriction is paused).
DROP TRIGGER IF EXISTS enforce_public_event_organizer_trg ON public.events;

-- Backfill any rows missing ticket_currency (defensive; column is NOT NULL with default 'EUR').
UPDATE public.events SET ticket_currency = 'EUR' WHERE ticket_currency IS NULL;