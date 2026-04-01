/*
  # Create Odds Table for Live Odds Storage

  1. New Tables
    - `odds`
      - `id` (uuid, primary key) - Unique identifier
      - `sport` (text, not null) - Sport type (Football, Basketball, etc.)
      - `home_team` (text, not null) - Home team name
      - `away_team` (text, not null) - Away team name
      - `game_time` (timestamptz, not null) - Game start time
      - `market_type` (text, not null) - Market type (Money Line, Spread, etc.)
      - `sportsbook` (text, not null) - Sportsbook name
      - `home_odds` (numeric) - Odds for home team
      - `away_odds` (numeric) - Odds for away team
      - `spread` (numeric) - Point spread value
      - `total` (numeric) - Over/under total
      - `external_id` (text) - External API game ID
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `odds` table
    - Allow public read access for odds data

  3. Indexes
    - Index on sport for filtering
    - Index on game_time for sorting
    - Index on external_id for updates
*/

CREATE TABLE IF NOT EXISTS odds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  game_time timestamptz NOT NULL,
  market_type text NOT NULL,
  sportsbook text NOT NULL,
  home_odds numeric,
  away_odds numeric,
  spread numeric,
  total numeric,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(external_id, market_type, sportsbook)
);

CREATE INDEX IF NOT EXISTS idx_odds_sport ON odds(sport);
CREATE INDEX IF NOT EXISTS idx_odds_game_time ON odds(game_time);
CREATE INDEX IF NOT EXISTS idx_odds_external_id ON odds(external_id);

ALTER TABLE odds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to odds"
  ON odds
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to odds"
  ON odds
  FOR SELECT
  TO authenticated
  USING (true);