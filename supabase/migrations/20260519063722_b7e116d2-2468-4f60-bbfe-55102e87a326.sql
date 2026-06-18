-- Birthday on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date;

-- Pulse tables
CREATE TABLE IF NOT EXISTS public.event_pulses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  started_by uuid NOT NULL,
  question text NOT NULL DEFAULT 'Is this actually happening?',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE TABLE IF NOT EXISTS public.event_pulse_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id uuid NOT NULL REFERENCES public.event_pulses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote text NOT NULL CHECK (vote IN ('yes','no')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pulse_id, user_id)
);

ALTER TABLE public.event_pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_pulse_votes ENABLE ROW LEVEL SECURITY;

-- Pulses: viewable by attendees of the event
CREATE POLICY "Pulses viewable by event attendees"
ON public.event_pulses FOR SELECT
USING (public.is_event_attendee(event_id, auth.uid()));

CREATE POLICY "Attendees can start a pulse"
ON public.event_pulses FOR INSERT
WITH CHECK (auth.uid() = started_by AND public.is_event_attendee(event_id, auth.uid()));

-- Votes: voter can read their own vote; aggregates are computed via select count by attendees
CREATE POLICY "Voter can read own vote"
ON public.event_pulse_votes FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.event_pulses p
  WHERE p.id = pulse_id AND public.is_event_attendee(p.event_id, auth.uid())
));

CREATE POLICY "Attendees can vote once"
ON public.event_pulse_votes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.event_pulses p
    WHERE p.id = pulse_id AND public.is_event_attendee(p.event_id, auth.uid())
  )
);
