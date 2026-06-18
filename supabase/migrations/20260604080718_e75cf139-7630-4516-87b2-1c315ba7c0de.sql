ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capsule_dismissed_at timestamptz;

CREATE OR REPLACE FUNCTION public.cleanup_empty_capsules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events e
  SET capsule_dismissed_at = now()
  WHERE e.capsule_dismissed_at IS NULL
    AND e.date IS NOT NULL
    AND ((e.date::timestamp + COALESCE(e.time, '00:00'::time)) < now() - interval '24 hours')
    AND NOT EXISTS (SELECT 1 FROM public.time_capsule_photos p WHERE p.event_id = e.id)
    AND NOT EXISTS (SELECT 1 FROM public.time_capsule_messages m WHERE m.event_id = e.id);
END;
$$;

SELECT public.cleanup_empty_capsules();