/*
  Remove anonymous / shared-null user access for bets and deposits.
  App requires sign-in; rows are owned by auth.uid().

  - Drops legacy anon and user_id IS NULL policies
  - Authenticated users may only read/write their own rows
  - Removes orphan rows from the pre-auth demo era (user_id IS NULL)
*/

-- Deposits: drop anonymous-era policies
DROP POLICY IF EXISTS "Allow anonymous read access to deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow anonymous insert to deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow anonymous update to deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow anonymous delete from deposits" ON public.deposits;

-- Bets: drop shared-null policies (applied to all roles)
DROP POLICY IF EXISTS "Allow public read access to bets" ON public.bets;
DROP POLICY IF EXISTS "Allow public insert access to bets" ON public.bets;
DROP POLICY IF EXISTS "Allow public update access to bets" ON public.bets;
DROP POLICY IF EXISTS "Allow public delete access to bets" ON public.bets;

-- Orphan demo rows are no longer accessible after RLS tightening
DELETE FROM public.bets WHERE user_id IS NULL;
DELETE FROM public.deposits WHERE user_id IS NULL;

-- Bets: per-user policies (deposits already have these for authenticated)
DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
CREATE POLICY "Users can view own bets"
  ON public.bets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;
CREATE POLICY "Users can insert own bets"
  ON public.bets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bets" ON public.bets;
CREATE POLICY "Users can update own bets"
  ON public.bets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bets" ON public.bets;
CREATE POLICY "Users can delete own bets"
  ON public.bets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Deposits: ensure authenticated policies exist (idempotent)
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
CREATE POLICY "Users can view own deposits"
  ON public.deposits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own deposits" ON public.deposits;
CREATE POLICY "Users can insert own deposits"
  ON public.deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deposits" ON public.deposits;
CREATE POLICY "Users can update own deposits"
  ON public.deposits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own deposits" ON public.deposits;
CREATE POLICY "Users can delete own deposits"
  ON public.deposits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
