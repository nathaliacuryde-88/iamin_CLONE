CREATE OR REPLACE FUNCTION public.get_event_pulse_stats(_event_id uuid)
 RETURNS TABLE(total_ratings integer, fire_count integer, mid_count integer, flop_count integer, avg_score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int AS total_ratings,
    COUNT(*) FILTER (WHERE rating = 'fire')::int AS fire_count,
    COUNT(*) FILTER (WHERE rating = 'mid')::int AS mid_count,
    COUNT(*) FILTER (WHERE rating = 'flop')::int AS flop_count,
    ROUND(AVG(CASE rating WHEN 'fire' THEN 5 WHEN 'mid' THEN 3 WHEN 'flop' THEN 1 END)::numeric, 2) AS avg_score
  FROM public.event_ratings r
  WHERE r.event_id = _event_id
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = _event_id AND e.created_by = auth.uid()
      )
      OR (
        public.is_event_attendee(_event_id, auth.uid())
        AND public.event_has_ended(_event_id)
      )
    );
$function$;