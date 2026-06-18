
CREATE TABLE public.birthday_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  birthday_date date NOT NULL,
  emoji text NOT NULL DEFAULT '🎂',
  message text,
  color text NOT NULL DEFAULT 'from-primary to-accent',
  opened_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT birthday_cards_unique_per_birthday UNIQUE (sender_id, recipient_id, birthday_date),
  CONSTRAINT birthday_cards_not_self CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_birthday_cards_recipient ON public.birthday_cards(recipient_id, opened_at);
CREATE INDEX idx_birthday_cards_birthday ON public.birthday_cards(recipient_id, birthday_date);

ALTER TABLE public.birthday_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mutual friends can send birthday cards"
ON public.birthday_cards
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND sender_id <> recipient_id
  AND public.are_mutual_friends(sender_id, recipient_id)
);

CREATE POLICY "Sender or recipient can view cards"
ON public.birthday_cards
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipient can mark opened"
ON public.birthday_cards
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Sender or recipient can delete"
ON public.birthday_cards
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.notify_birthday_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, sender_id, type, content)
  VALUES (NEW.recipient_id, NEW.sender_id, 'birthday_card', 'sent you a birthday card 🎉');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_birthday_card
AFTER INSERT ON public.birthday_cards
FOR EACH ROW EXECUTE FUNCTION public.notify_birthday_card();
