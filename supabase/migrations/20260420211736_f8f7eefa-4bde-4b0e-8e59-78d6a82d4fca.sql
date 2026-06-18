
-- Friend requests with approval flow
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status public.friend_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, recipient_id),
  CHECK (requester_id <> recipient_id)
);

CREATE INDEX idx_friend_requests_recipient ON public.friend_requests(recipient_id, status);
CREATE INDEX idx_friend_requests_requester ON public.friend_requests(requester_id, status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON public.friend_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipient can update status"
ON public.friend_requests FOR UPDATE
USING (auth.uid() = recipient_id);

CREATE POLICY "Either party can delete"
ON public.friend_requests FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.update_friend_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.update_friend_requests_updated_at();

-- When a request is accepted, create mutual follows so existing "friend" logic just works
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.recipient_id)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.recipient_id, NEW.requester_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request_accepted
AFTER UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_friend_request_accepted();

-- Make follows unique to prevent duplicates from the trigger
CREATE UNIQUE INDEX IF NOT EXISTS uq_follows_pair ON public.follows(follower_id, following_id);

-- Notify recipient when request is created
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, sender_id, type, content)
  VALUES (NEW.recipient_id, NEW.requester_id, 'friend_request', 'wants to be friends');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request_created
AFTER INSERT ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();
