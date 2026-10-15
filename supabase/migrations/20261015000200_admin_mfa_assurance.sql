-- Apply exactly one copy (Drizzle OR Supabase). No users or factors are enrolled here.
-- Preserve password-only access until that administrator verifies a factor.
-- Existing content/storage policies and admin RPCs all call this helper.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id AND r.role = _role
  ) AND (
    _role <> 'admin'::public.app_role
    OR NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors f
      WHERE f.user_id = _user_id AND f.status = 'verified'
    )
    OR COALESCE(_user_id = auth.uid() AND (auth.jwt()->>'aal') = 'aal2', false)
  );
$$;
COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS
  'Role check: verified administrator MFA factors require own AAL2 JWT. Own-role SELECT remains available for login verification.';
