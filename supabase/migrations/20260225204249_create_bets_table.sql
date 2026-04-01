/*
  # Create bets table for bet tracking

  1. New Tables
    - `bets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable for now)
      - `bet_name` (text) - name/description of the bet
      - `sportsbook` (text) - sportsbook name
      - `odds` (integer) - American odds
      - `amount_staked` (numeric) - amount wagered
      - `is_bonus_bet` (boolean) - whether it's a bonus/free bet
      - `is_odds_boost` (boolean) - whether odds boost was used
      - `tags` (text array) - optional tags for categorization
      - `status` (text) - pending, won, lost, void
      - `created_at` (timestamptz)
      - `settled_at` (timestamptz, nullable)
      - `group_id` (uuid, nullable) - to group related bets together (e.g., arb pairs)

  2. Security
    - Enable RLS on `bets` table
    - Add policy for public access (can be restricted later when auth is added)
*/

CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  bet_name text NOT NULL,
  sportsbook text NOT NULL,
  odds integer NOT NULL,
  amount_staked numeric(10, 2) NOT NULL,
  is_bonus_bet boolean DEFAULT false,
  is_odds_boost boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz,
  group_id uuid
);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to bets"
  ON bets FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Allow public insert access to bets"
  ON bets FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow public update access to bets"
  ON bets FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow public delete access to bets"
  ON bets FOR DELETE
  USING (user_id IS NULL);