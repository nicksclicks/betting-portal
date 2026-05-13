/*
  Link public.users to auth.users, remove anonymous access, and add RLS that
  matches the product rules (admin vs basic).

  After this migration:
  - Each profile row id must match auth.users.id (FK, ON DELETE CASCADE).
  - New Auth signups get a profile row via trigger (default role: user / "basic").
  - Promote your first admin in the SQL editor, e.g.:
      UPDATE public.users SET role = 'admin' WHERE email = 'you@example.com';
  - Admin-only user lifecycle uses Edge Functions (service role), not client INSERT/DELETE.
*/

-- Drop legacy policies (names from prior migrations)
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
DROP POLICY IF EXISTS "Allow public insert access" ON public.users;
DROP POLICY IF EXISTS "Allow public update access" ON public.users;
DROP POLICY IF EXISTS "Allow public delete access" ON public.users;

-- Orphan seed rows / old ids that are not Auth users must go before adding FK
DELETE FROM public.users;

ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Backfill profiles for any existing Auth users (e.g. created in Dashboard)
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
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

CREATE OR REPLACE FUNCTION public.is_admin(check_uid uuid DEFAULT auth.uid())
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

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

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
  EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.users_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT public.is_admin(auth.uid()) INTO caller_is_admin;

  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Cannot change user id';
  END IF;

  IF OLD.role IS DISTINCT FROM NEW.role AND NOT caller_is_admin THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_before_update ON public.users;
CREATE TRIGGER users_before_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.users_before_update();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_or_admin"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "users_delete_admin"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()) AND id <> auth.uid());
