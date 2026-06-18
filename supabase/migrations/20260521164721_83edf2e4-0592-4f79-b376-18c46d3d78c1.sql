
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip self-follow edge cases
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (recipient_id, sender_id, type, content)
  VALUES (NEW.following_id, NEW.follower_id, 'new_follower', 'started following you');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.follows;
CREATE TRIGGER trg_notify_new_follower
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Backfill: for existing follows where no new_follower notification exists, create one.
-- Skip mutual follows (those typically came from accepted friend_requests and were already notified differently).
INSERT INTO public.notifications (recipient_id, sender_id, type, content, created_at)
SELECT f.following_id, f.follower_id, 'new_follower', 'started following you', f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.recipient_id = f.following_id
    AND n.sender_id = f.follower_id
    AND n.type IN ('new_follower', 'friend_request')
)
AND NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id AND f2.following_id = f.follower_id
);
