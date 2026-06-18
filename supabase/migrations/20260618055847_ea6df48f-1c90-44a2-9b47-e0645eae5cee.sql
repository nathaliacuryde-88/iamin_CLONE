
CREATE OR REPLACE FUNCTION public.get_event_preview(_event_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', e.id,
    'name', e.name,
    'date', e.date,
    'time', e.time,
    'end_date', e.end_date,
    'end_time', e.end_time,
    'location', e.location,
    'city', e.city,
    'lat', e.lat,
    'lng', e.lng,
    'image_url', e.image_url,
    'description', e.description,
    'vibe_category', e.vibe_category,
    'visibility', e.visibility,
    'created_by', e.created_by,
    'host', jsonb_build_object(
      'user_id', p.user_id,
      'display_name', p.display_name,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'account_type', p.account_type
    )
  )
  FROM public.events e
  LEFT JOIN public.profiles p ON p.user_id = e.created_by
  WHERE e.id = _event_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_preview(uuid) TO authenticated, anon;
