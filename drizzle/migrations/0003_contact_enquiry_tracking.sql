-- Additive rollout: existing enquiries/outbox rows are preserved; no emails are sent.
ALTER TABLE public.messages ADD COLUMN enquiry_status text NOT NULL DEFAULT 'new'
  CHECK (enquiry_status IN ('new','awaiting_admin','replied','closed'));
CREATE INDEX messages_enquiry_status_date ON public.messages(enquiry_status, created_at DESC, id);

CREATE TABLE public.contact_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('admin_notification','faq_reply','admin_review','status_change')),
  outcome text NOT NULL CHECK (outcome IN ('pending','processing','sent','failed','uncertain','recorded')),
  detail text NOT NULL,
  provider_message_id text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id,event_key)
);
CREATE INDEX contact_email_events_history ON public.contact_email_events(message_id,created_at DESC);
ALTER TABLE public.contact_email_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.contact_email_events TO authenticated;
GRANT ALL ON public.contact_email_events TO service_role;
CREATE POLICY "Admin email history" ON public.contact_email_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.contact_automation_runs (
  message_id uuid PRIMARY KEY REFERENCES public.messages(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL UNIQUE,
  route text NOT NULL CHECK (route IN ('faq','admin')),
  state text NOT NULL CHECK (state IN ('processing','sent','failed','uncertain')),
  provider_message_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
ALTER TABLE public.contact_automation_runs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.contact_automation_runs TO service_role;
GRANT SELECT ON public.contact_automation_runs TO authenticated;
CREATE POLICY "Admin automation status" ON public.contact_automation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE FUNCTION public.track_enquiry_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.enquiry_status := 'new';
  ELSIF NEW.enquiry_status IS DISTINCT FROM OLD.enquiry_status THEN
    IF NOT (public.has_role(auth.uid(),'admin') OR
      coalesce(current_setting('request.jwt.claim.role', true),'') = 'service_role' OR
      coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb)->>'role','') = 'service_role') THEN
      RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
    END IF;
    INSERT INTO public.contact_email_events(message_id,event_key,kind,outcome,detail,actor_id)
      VALUES (OLD.id,gen_random_uuid()::text,'status_change','recorded',
        OLD.enquiry_status || ' → ' || NEW.enquiry_status,auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER track_enquiry_status BEFORE INSERT OR UPDATE OF enquiry_status ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.track_enquiry_status();

CREATE FUNCTION public.track_contact_notification() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.contact_email_events(message_id,event_key,kind,outcome,detail,provider_message_id)
  VALUES (NEW.message_id,gen_random_uuid()::text,'admin_notification',NEW.status,
    CASE NEW.status WHEN 'sent' THEN 'Gmail accepted the website notification.'
      WHEN 'failed' THEN 'Notification failed; admin review required.'
      WHEN 'processing' THEN 'Sending website notification; attempt ' || NEW.attempts::text || '.'
      ELSE 'Website notification queued; attempts so far: ' || NEW.attempts::text || '.' END,
    NEW.gmail_message_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER track_contact_notification AFTER INSERT OR UPDATE OF status,attempts ON public.contact_email_outbox
FOR EACH ROW EXECUTE FUNCTION public.track_contact_notification();

-- Authenticated only through the dedicated server endpoint. One durable claim per enquiry.
CREATE FUNCTION public.begin_contact_automation(p_message_id uuid,p_attempt_id uuid,p_route text,p_visitor_email text)
RETURNS boolean LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE claimed uuid; visitor text;
BEGIN
  IF p_route NOT IN ('faq','admin') OR p_route IS NULL THEN RAISE EXCEPTION 'Invalid route'; END IF;
  SELECT email INTO visitor FROM public.messages WHERE id=p_message_id FOR UPDATE;
  IF NOT FOUND OR lower(visitor) IS DISTINCT FROM lower(p_visitor_email) THEN
    RAISE EXCEPTION 'Enquiry mismatch';
  END IF;
  INSERT INTO public.contact_automation_runs(message_id,attempt_id,route,state)
    VALUES(p_message_id,p_attempt_id,p_route,'processing') ON CONFLICT(message_id) DO NOTHING
    RETURNING message_id INTO claimed;
  IF claimed IS NULL THEN RETURN false; END IF;
  INSERT INTO public.contact_email_events(message_id,event_key,kind,outcome,detail)
    VALUES(p_message_id,p_attempt_id::text || ':begin',
      CASE p_route WHEN 'faq' THEN 'faq_reply' ELSE 'admin_review' END,'processing','Automation started.');
  IF p_route='admin' THEN
    UPDATE public.messages SET enquiry_status='awaiting_admin' WHERE id=p_message_id AND enquiry_status='new';
  END IF;
  RETURN true;
END; $$;

CREATE FUNCTION public.finish_contact_automation(p_message_id uuid,p_attempt_id uuid,p_outcome text,p_provider_message_id text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE r public.contact_automation_runs%ROWTYPE;
BEGIN
  IF p_outcome IS NULL OR p_outcome NOT IN ('sent','failed','uncertain') OR
    (p_outcome='sent' AND coalesce(length(p_provider_message_id),0) NOT BETWEEN 1 AND 200) THEN
    RAISE EXCEPTION 'Invalid result';
  END IF;
  SELECT * INTO r FROM public.contact_automation_runs WHERE message_id=p_message_id AND attempt_id=p_attempt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown attempt'; END IF;
  IF r.state <> 'processing' THEN
    IF r.state=p_outcome AND r.provider_message_id IS NOT DISTINCT FROM p_provider_message_id THEN RETURN true; END IF;
    RAISE EXCEPTION 'Result already recorded';
  END IF;
  UPDATE public.contact_automation_runs SET state=p_outcome,provider_message_id=p_provider_message_id,
    finished_at=now() WHERE message_id=p_message_id;
  INSERT INTO public.contact_email_events(message_id,event_key,kind,outcome,detail,provider_message_id)
    VALUES(p_message_id,p_attempt_id::text || ':finish',CASE r.route WHEN 'faq' THEN 'faq_reply' ELSE 'admin_review' END,
      p_outcome,CASE p_outcome WHEN 'sent' THEN 'Gmail accepted the email; inbox delivery is not confirmed.'
        WHEN 'failed' THEN 'Email failed. Check Gmail Sent before retrying manually.'
        ELSE 'Delivery could not be confirmed. Check Gmail Sent before retrying manually.' END,p_provider_message_id);
  IF p_outcome <> 'sent' THEN
    UPDATE public.messages SET enquiry_status='awaiting_admin' WHERE id=p_message_id AND enquiry_status='new';
  END IF;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.begin_contact_automation(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_contact_automation(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_contact_automation(uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_contact_automation(uuid,uuid,text,text) TO service_role;

-- Search stays parameterized (including %, underscores and punctuation).
CREATE FUNCTION public.admin_contact_enquiries(p_search text DEFAULT '',p_status text DEFAULT '',p_delivery text DEFAULT '',
  p_from timestamptz DEFAULT NULL,p_to timestamptz DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 25)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_search IS NULL OR p_status IS NULL OR p_delivery IS NULL OR p_limit IS NULL OR p_offset IS NULL
    OR p_status NOT IN ('','new','awaiting_admin','replied','closed') OR p_delivery NOT IN ('','attention','sent','untracked')
    OR length(p_search)>254 OR p_limit NOT BETWEEN 1 AND 100 OR p_offset<0 THEN RAISE EXCEPTION 'Invalid filter'; END IF;
  WITH filtered AS (
    SELECT m.*,to_jsonb(o) AS notification,
      CASE WHEN r.state='processing' AND r.started_at<now()-interval '10 minutes' THEN
        to_jsonb(r) || '{"state":"uncertain"}'::jsonb ELSE to_jsonb(r) END AS automation
    FROM public.messages m LEFT JOIN public.contact_email_outbox o ON o.message_id=m.id
      LEFT JOIN public.contact_automation_runs r ON r.message_id=m.id
    WHERE (p_status='' OR m.enquiry_status=p_status)
      AND (p_search='' OR strpos(lower(m.name || ' ' || m.email || ' ' || m.subject || ' ' || m.id::text),lower(p_search))>0)
      AND (p_from IS NULL OR m.created_at>=p_from) AND (p_to IS NULL OR m.created_at<p_to)
      AND (p_delivery='' OR
        (p_delivery='attention' AND (o.status='failed' OR (o.status='pending' AND o.attempts>0)
          OR (o.status='processing' AND o.locked_until<now()) OR r.state IN ('failed','uncertain')
          OR (r.state='processing' AND r.started_at<now()-interval '10 minutes')))
        OR (p_delivery='sent' AND (o.status='sent' OR r.state='sent'))
        OR (p_delivery='untracked' AND r.message_id IS NULL))
  ), page AS (SELECT * FROM filtered ORDER BY created_at DESC,id LIMIT p_limit OFFSET p_offset)
  SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC,id) FROM page),'[]'::jsonb)) INTO result;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.admin_contact_enquiries(text,text,text,timestamptz,timestamptz,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_contact_enquiries(text,text,text,timestamptz,timestamptz,integer,integer) TO authenticated;
