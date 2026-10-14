CREATE TABLE public.contact_email_outbox (
  message_id uuid PRIMARY KEY REFERENCES public.messages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  sent_at timestamptz,
  gmail_message_id text,
  last_error text
);
ALTER TABLE public.contact_email_outbox ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_email_outbox TO service_role;
GRANT SELECT ON public.contact_email_outbox TO authenticated;
CREATE POLICY "Admins can view notification status" ON public.contact_email_outbox
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX contact_email_outbox_pending ON public.contact_email_outbox(next_attempt_at)
WHERE status IN ('pending', 'processing');
CREATE INDEX messages_email_created_at ON public.messages(lower(email), created_at DESC);

CREATE FUNCTION public.enqueue_contact_enquiry(
  p_request_id uuid, p_name text, p_email text, p_phone text, p_subject text, p_message text
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE existing public.messages%ROWTYPE;
BEGIN
  IF p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 1 AND 100
    OR p_email IS NULL OR length(trim(p_email)) NOT BETWEEN 3 AND 254
    OR p_subject IS NULL OR length(trim(p_subject)) NOT BETWEEN 1 AND 150
    OR p_message IS NULL OR length(trim(p_message)) NOT BETWEEN 1 AND 5000
    OR (p_phone IS NOT NULL AND p_phone !~ '^[0-9]{10}$') THEN
    RAISE EXCEPTION 'Invalid enquiry' USING ERRCODE = '23514';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lower(p_email), 0));
  SELECT * INTO existing FROM public.messages WHERE id = p_request_id;
  IF FOUND THEN
    IF existing.name IS DISTINCT FROM p_name OR existing.email IS DISTINCT FROM p_email
      OR existing.phone IS DISTINCT FROM p_phone OR existing.subject IS DISTINCT FROM p_subject
      OR existing.message IS DISTINCT FROM p_message THEN
      RAISE EXCEPTION 'Request reference conflict' USING ERRCODE = '23505';
    END IF;
    RETURN p_request_id;
  END IF;
  IF (SELECT count(*) FROM public.messages WHERE lower(email) = lower(p_email)
      AND created_at > now() - interval '15 minutes') >= 5 THEN
    RAISE EXCEPTION 'Contact rate limit exceeded';
  END IF;
  INSERT INTO public.messages(id,name,email,phone,subject,message)
    VALUES (p_request_id,p_name,p_email,p_phone,p_subject,p_message);
  INSERT INTO public.contact_email_outbox(message_id) VALUES (p_request_id);
  RETURN p_request_id;
END;
$$;

CREATE FUNCTION public.claim_contact_email(p_message_id uuid DEFAULT NULL)
RETURNS TABLE(message_id uuid, attempts integer)
LANGUAGE sql
SET search_path = ''
AS $$
  WITH exhausted AS (
    UPDATE public.contact_email_outbox
    SET status = 'failed', locked_until = NULL, last_error = 'Final attempt expired before completion'
    WHERE status = 'processing' AND attempts >= 5 AND locked_until < now()
    RETURNING message_id
  ), eligible AS (
    SELECT o.message_id FROM public.contact_email_outbox o
    WHERE (p_message_id IS NULL OR o.message_id = p_message_id)
      AND o.attempts < 5
      AND ((o.status = 'pending' AND o.next_attempt_at <= now())
        OR (o.status = 'processing' AND o.locked_until < now()))
    ORDER BY o.next_attempt_at
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  UPDATE public.contact_email_outbox o
    SET status = 'processing', attempts = o.attempts + 1, locked_until = now() + interval '2 minutes'
    FROM eligible WHERE o.message_id = eligible.message_id
    RETURNING o.message_id, o.attempts;
$$;

REVOKE ALL ON FUNCTION public.enqueue_contact_enquiry(uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_contact_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_contact_enquiry(uuid,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_contact_email(uuid) TO service_role;

-- Keep the existing form working while backend and frontend are deployed separately.
-- After the new frontend is live and verified, run rollout/finalize-contact-cutover.sql.
