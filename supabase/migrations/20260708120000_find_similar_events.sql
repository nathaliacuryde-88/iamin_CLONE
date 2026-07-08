-- =========================================================
-- Duplicate-event detection (Phase 1)
-- Fuzzy, visibility-scoped "is there already an event like this?" lookup.
-- Mirrors src/lib/eventMatch.ts so client and server agree.
-- =========================================================

-- Trigram similarity for fuzzy name matching.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Normalize a title the same way the client does: lowercase, punctuation ->
-- space, collapse whitespace. IMMUTABLE so it can back an expression index.
-- (Accent-stripping is intentionally omitted here — `unaccent` is only STABLE
--  and would make this non-immutable/index-ineligible; the client strips
--  accents and trigram matching tolerates the rest.)
CREATE OR REPLACE FUNCTION public.normalize_event_name(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(
    regexp_replace(
      regexp_replace(lower(coalesce(_name, '')), '[^a-z0-9]+', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  );
$$;

-- Canonicalize a source URL for cross-user link matching: drop scheme, www,
-- query/hash, and trailing slash. Returns NULL for empty input.
CREATE OR REPLACE FUNCTION public.normalize_source_url(_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _url IS NULL OR btrim(_url) = '' THEN NULL
    ELSE rtrim(
           regexp_replace(
             regexp_replace(
               regexp_replace(lower(btrim(_url)), '^https?://', ''), -- drop scheme
               '^www\.', ''                                          -- drop www.
             ),
             '[?#].*$', ''                                           -- drop query + hash
           ),
           '/'                                                       -- drop trailing slash
         )
  END;
$$;

-- Find events similar to a prospective new event that the CURRENT user is
-- allowed to see. Best matches first: a shared source link, OR a similar name
-- within ±1 day. Visibility is enforced via can_view_event so nothing private
-- leaks.
CREATE OR REPLACE FUNCTION public.find_similar_events(
  _name text,
  _date date DEFAULT NULL,
  _city text DEFAULT NULL,
  _source_url text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  date date,
  city text,
  source_url text,
  created_by uuid,
  creator_name text,
  score real,
  same_link boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH input AS (
    SELECT
      public.normalize_event_name(_name) AS n_name,
      public.normalize_source_url(_source_url) AS n_url
  )
  SELECT
    e.id, e.name, e.date, e.city, e.source_url, e.created_by,
    p.display_name AS creator_name,
    GREATEST(
      similarity(public.normalize_event_name(e.name), i.n_name),
      CASE
        WHEN i.n_url IS NOT NULL
         AND public.normalize_source_url(e.source_url) = i.n_url
        THEN 1.0 ELSE 0
      END
    )::real AS score,
    (i.n_url IS NOT NULL AND public.normalize_source_url(e.source_url) = i.n_url) AS same_link
  FROM public.events e
  CROSS JOIN input i
  LEFT JOIN public.profiles p ON p.user_id = e.created_by
  WHERE e.created_by <> auth.uid()                      -- someone else's event
    AND public.can_view_event(e.id, auth.uid())         -- respect visibility
    AND (
      (i.n_url IS NOT NULL AND public.normalize_source_url(e.source_url) = i.n_url)
      OR (
        similarity(public.normalize_event_name(e.name), i.n_name) >= 0.35
        AND (_date IS NULL OR e.date IS NULL OR abs(e.date - _date) <= 1)
      )
    )
  ORDER BY score DESC
  LIMIT 5;
$$;

-- Only signed-in users; never anon.
REVOKE EXECUTE ON FUNCTION public.find_similar_events(text, date, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.find_similar_events(text, date, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_event_name(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.normalize_source_url(text) FROM anon;

-- Speed up the trigram scan over event names.
CREATE INDEX IF NOT EXISTS idx_events_name_trgm
  ON public.events USING gin (public.normalize_event_name(name) gin_trgm_ops);
