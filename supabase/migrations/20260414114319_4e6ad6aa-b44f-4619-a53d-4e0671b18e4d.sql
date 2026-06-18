
-- Create event visibility enum
CREATE TYPE public.event_visibility AS ENUM ('public', 'tentative');

-- Add visibility and vibe_category to events
ALTER TABLE public.events ADD COLUMN visibility event_visibility NOT NULL DEFAULT 'public';
ALTER TABLE public.events ADD COLUMN vibe_category TEXT;

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create time capsule photos table
CREATE TABLE public.time_capsule_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_capsule_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time capsule photos are viewable by everyone" ON public.time_capsule_photos FOR SELECT USING (true);
CREATE POLICY "Users can upload time capsule photos" ON public.time_capsule_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON public.time_capsule_photos FOR DELETE USING (auth.uid() = user_id);

-- Update events RLS to handle visibility (tentative events only visible to creator)
DROP POLICY "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable based on visibility" ON public.events FOR SELECT
  USING (visibility = 'public' OR auth.uid() = created_by);

-- Create time-capsule storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('time-capsule', 'time-capsule', true);

CREATE POLICY "Time capsule images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'time-capsule');
CREATE POLICY "Authenticated users can upload time capsule images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'time-capsule' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own time capsule images" ON storage.objects FOR DELETE USING (bucket_id = 'time-capsule' AND auth.uid()::text = (storage.foldername(name))[1]);
