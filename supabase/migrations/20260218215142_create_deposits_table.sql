/*
  # Create Deposits Table for Betting Dashboard

  1. New Tables
    - `deposits`
      - `id` (uuid, primary key) - Unique identifier for each deposit
      - `sportsbook` (text, not null) - Name of the sportsbook
      - `deposit_amount` (numeric, not null) - Amount deposited
      - `deposit_date` (date, not null) - Date of the deposit
      - `bonus_received` (numeric, default 0) - Bonus amount received
      - `rollover_multiplier` (numeric, default 1) - Rollover requirement multiplier
      - `current_balance` (numeric, default 0) - Current balance at sportsbook
      - `status` (text, default 'active') - Status: active, completed, withdrawn
      - `notes` (text) - Optional notes
      - `user_id` (uuid) - User identifier for future auth integration
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `deposits` table
    - Add policies for authenticated users to manage their own data
    - Add policy for anonymous access (for demo purposes without auth)

  3. Indexes
    - Index on user_id for faster lookups
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sportsbook text NOT NULL,
  deposit_amount numeric NOT NULL DEFAULT 0,
  deposit_date date NOT NULL DEFAULT CURRENT_DATE,
  bonus_received numeric DEFAULT 0,
  rollover_multiplier numeric DEFAULT 1,
  current_balance numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  notes text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to deposits"
  ON deposits
  FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Allow anonymous insert to deposits"
  ON deposits
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous update to deposits"
  ON deposits
  FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous delete from deposits"
  ON deposits
  FOR DELETE
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Users can view own deposits"
  ON deposits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits"
  ON deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposits"
  ON deposits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deposits"
  ON deposits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);