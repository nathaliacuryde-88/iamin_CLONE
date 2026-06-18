-- =========================================================
-- event_invite_suggestions
-- =========================================================
CREATE TABLE public.event_invite_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  suggester_id uuid NOT NULL,
  suggested_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, suggester_id, suggested_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_invite_suggestions TO authenticated;
GRANT ALL ON public.event_invite_suggestions TO service_role;

ALTER TABLE public.event_invite_suggestions ENABLE ROW LEVEL SECURITY;

-- Suggester, suggested user, and event owner can read
CREATE POLICY "View invite suggestions" ON public.event_invite_suggestions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = suggester_id
    OR auth.uid() = suggested_user_id
    OR public.is_event_owner(event_id, auth.uid())
  );

-- Anyone who can view the event can suggest a guest
CREATE POLICY "Create invite suggestion" ON public.event_invite_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = suggester_id
    AND public.can_view_event(event_id, auth.uid())
    AND suggester_id <> suggested_user_id
  );

-- Only host can update (approve/decline). Suggester can cancel.
CREATE POLICY "Update invite suggestion" ON public.event_invite_suggestions
  FOR UPDATE TO authenticated
  USING (
    public.is_event_owner(event_id, auth.uid())
    OR auth.uid() = suggester_id
  );

CREATE POLICY "Delete invite suggestion" ON public.event_invite_suggestions
  FOR DELETE TO authenticated
  USING (auth.uid() = suggester_id OR public.is_event_owner(event_id, auth.uid()));

CREATE TRIGGER set_invite_suggestion_updated_at
  BEFORE UPDATE ON public.event_invite_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- event_cohost_requests
-- =========================================================
CREATE TABLE public.event_cohost_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, requester_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_cohost_requests TO authenticated;
GRANT ALL ON public.event_cohost_requests TO service_role;

ALTER TABLE public.event_cohost_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View cohost requests" ON public.event_cohost_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_id
    OR public.is_event_owner(event_id, auth.uid())
  );

CREATE POLICY "Create cohost request" ON public.event_cohost_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND public.can_view_event(event_id, auth.uid())
    AND NOT public.is_event_owner(event_id, auth.uid())
  );

CREATE POLICY "Update cohost request" ON public.event_cohost_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_event_owner(event_id, auth.uid())
    OR auth.uid() = requester_id
  );

CREATE POLICY "Delete cohost request" ON public.event_cohost_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR public.is_event_owner(event_id, auth.uid()));

CREATE TRIGGER set_cohost_request_updated_at
  BEFORE UPDATE ON public.event_cohost_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Notification triggers
-- =========================================================

-- New suggestion → notify host
CREATE OR REPLACE FUNCTION public.notify_invite_suggestion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _host uuid;
BEGIN
  SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;
  IF _host IS NOT NULL AND _host <> NEW.suggester_id THEN
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (_host, NEW.suggester_id, 'invite_suggestion', NEW.event_id,
            'wants to invite someone to your event');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invite_suggestion_created
  AFTER INSERT ON public.event_invite_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.notify_invite_suggestion();

-- Approval of suggestion → create real invite + notify suggester
CREATE OR REPLACE FUNCTION public.handle_invite_suggestion_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _host uuid;
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;
    -- Create the actual invite (existing notify_event_invite trigger will notify the invitee)
    INSERT INTO public.event_invites (event_id, inviter_id, invitee_id)
    VALUES (NEW.event_id, _host, NEW.suggested_user_id)
    ON CONFLICT DO NOTHING;
    -- Tell the suggester their suggestion was accepted
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (NEW.suggester_id, _host, 'invite_suggestion_approved', NEW.event_id,
            'approved your invite suggestion');
  ELSIF NEW.status = 'declined' AND OLD.status <> 'declined' THEN
    SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (NEW.suggester_id, _host, 'invite_suggestion_declined', NEW.event_id,
            'declined your invite suggestion');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invite_suggestion_status_changed
  AFTER UPDATE ON public.event_invite_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.handle_invite_suggestion_approval();

-- New cohost request → notify host
CREATE OR REPLACE FUNCTION public.notify_cohost_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _host uuid;
BEGIN
  SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;
  IF _host IS NOT NULL AND _host <> NEW.requester_id THEN
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (_host, NEW.requester_id, 'cohost_request', NEW.event_id,
            'wants to help organize your event');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_cohost_request_created
  AFTER INSERT ON public.event_cohost_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_cohost_request();

-- Cohost approval → add collaborator + notify requester
CREATE OR REPLACE FUNCTION public.handle_cohost_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _host uuid;
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;
    INSERT INTO public.event_collaborators (event_id, user_id, added_by)
    VALUES (NEW.event_id, NEW.requester_id, _host)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (NEW.requester_id, _host, 'cohost_request_approved', NEW.event_id,
            'made you a co-host');
  ELSIF NEW.status = 'declined' AND OLD.status <> 'declined' THEN
    SELECT created_by INTO _host FROM public.events WHERE id = NEW.event_id;
    INSERT INTO public.notifications (recipient_id, sender_id, type, event_id, content)
    VALUES (NEW.requester_id, _host, 'cohost_request_declined', NEW.event_id,
            'declined your co-host request');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_cohost_request_status_changed
  AFTER UPDATE ON public.event_cohost_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_cohost_request_approval();
