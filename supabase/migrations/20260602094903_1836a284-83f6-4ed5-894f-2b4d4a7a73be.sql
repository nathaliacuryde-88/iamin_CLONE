CREATE TABLE public.time_capsule_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT time_capsule_messages_content_len CHECK (char_length(content) BETWEEN 1 AND 500),
  CONSTRAINT time_capsule_messages_unique_per_user UNIQUE (event_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_capsule_messages TO authenticated;
GRANT ALL ON public.time_capsule_messages TO service_role;

ALTER TABLE public.time_capsule_messages ENABLE ROW LEVEL SECURITY;

-- Author can always read own message (so they can edit before reveal)
CREATE POLICY "Author reads own capsule message"
ON public.time_capsule_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- All attendees can read every message once the event has ended
CREATE POLICY "Attendees read capsule messages after event ends"
ON public.time_capsule_messages FOR SELECT TO authenticated
USING (
  public.event_has_ended(event_id)
  AND public.is_event_attendee(event_id, auth.uid())
);

-- Attendees can seal a message before the event ends
CREATE POLICY "Attendees can seal a capsule message"
ON public.time_capsule_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_event_attendee(event_id, auth.uid())
  AND NOT public.event_has_ended(event_id)
);

-- Author can edit only before the event ends
CREATE POLICY "Author edits capsule message before reveal"
ON public.time_capsule_messages FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND NOT public.event_has_ended(event_id))
WITH CHECK (auth.uid() = user_id AND NOT public.event_has_ended(event_id));

-- Author can always delete own message
CREATE POLICY "Author deletes own capsule message"
ON public.time_capsule_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER time_capsule_messages_set_updated_at
BEFORE UPDATE ON public.time_capsule_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_time_capsule_messages_event ON public.time_capsule_messages(event_id);