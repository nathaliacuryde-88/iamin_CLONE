CREATE TABLE public.profile_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  photo_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, photo_id)
);

ALTER TABLE public.profile_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlights are viewable by everyone"
ON public.profile_highlights
FOR SELECT
USING (true);

CREATE POLICY "Users can add their own highlights"
ON public.profile_highlights
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own highlights"
ON public.profile_highlights
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_profile_highlights_user ON public.profile_highlights(user_id);