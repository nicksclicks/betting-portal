/*
  Relax users_before_update role guard for trusted Supabase contexts.

  The previous check used only is_admin(auth.uid()). In the SQL editor, auth.uid()
  is NULL. In the Dashboard table editor, the request often uses service_role.
  Both should be allowed to change public.users.role for maintenance.

  App users (authenticated JWT, non-admin) still cannot change roles.
*/

CREATE OR REPLACE FUNCTION public.users_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
  trusted_backend boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT public.is_admin(auth.uid()) INTO caller_is_admin;

  trusted_backend :=
    (auth.role() = 'service_role')
    OR (session_user IN ('postgres', 'supabase_admin'));

  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Cannot change user id';
  END IF;

  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT trusted_backend AND auth.uid() IS NOT NULL AND NOT caller_is_admin THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
