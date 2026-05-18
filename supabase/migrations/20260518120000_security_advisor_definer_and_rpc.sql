/*
  Security advisor (lint 0028 / 0029):

  - Move SECURITY DEFINER helper is_admin out of public so it is not PostgREST-RPC
    exposed, while keeping EXECUTE for authenticated (RLS policy evaluation).
  - Revoke EXECUTE on trigger-only SECURITY DEFINER functions from anon /
    authenticated / PUBLIC (triggers do not require callers to have EXECUTE).
  - If public.rls_auto_enable exists (e.g. legacy tooling), revoke the same way.

  Leaked password protection (HaveIBeenPwned) is enabled in the Supabase
  Dashboard: Auth → Providers → Email (not controlled by this migration).
*/

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin(check_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = check_uid
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO service_role;

DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
CREATE POLICY "users_select_own_or_admin"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "users_update_admin" ON public.users;
CREATE POLICY "users_update_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
CREATE POLICY "users_delete_admin"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (private.is_admin(auth.uid()) AND id <> auth.uid());

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

  SELECT private.is_admin(auth.uid()) INTO caller_is_admin;

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

DROP FUNCTION IF EXISTS public.is_admin(uuid);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.users_before_update() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS sch,
      p.proname AS fnm,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      rec.sch,
      rec.fnm,
      rec.args
    );
  END LOOP;
END;
$$;
