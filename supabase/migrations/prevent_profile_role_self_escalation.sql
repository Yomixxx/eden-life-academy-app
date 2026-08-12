-- The "Users can update own profile" RLS policy only has a USING clause
-- (auth.uid() = id), no WITH CHECK — so nothing stopped a member from
-- setting role = 'admin' on their own row via a direct PATCH to
-- /rest/v1/profiles. RLS filters rows, not columns, so a policy-level fix
-- can't restrict a single column; this trigger silently reverts any role
-- change attempted by a non-admin instead.
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();
