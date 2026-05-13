/*
  Keep public.users in sync with auth.users:

  - Every new row in auth.users (Dashboard, sign-up, Admin API, etc.) gets a matching
    public.users profile via trigger.
  - Backfill any auth user who still has no profile (e.g. trigger was missing or failed).

  Idempotent with 20260512120000_users_auth_profiles_rls.sql: function is OR REPLACE;
  trigger is dropped and recreated using EXECUTE FUNCTION (Postgres 14+).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    CASE
      WHEN (NEW.raw_user_meta_data->>'role') IN ('admin', 'user') THEN (NEW.raw_user_meta_data->>'role')::text
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.users (id, email, name, role)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'name', split_part(COALESCE(au.email, 'user'), '@', 1)),
  CASE
    WHEN (au.raw_user_meta_data->>'role') IN ('admin', 'user') THEN (au.raw_user_meta_data->>'role')::text
    ELSE 'user'
  END
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;
