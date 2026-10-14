CREATE FUNCTION public.validate_message_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Phone must be exactly 10 digits or null'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_message_phone
BEFORE INSERT OR UPDATE OF phone ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.validate_message_phone();