import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type OddsRow = Database['public']['Tables']['odds']['Row'];

/** Columns returned by `fetchOddsRows` (matches Edge Function grouping) */
export type OddsSelectRow = Pick<
  OddsRow,
  | 'sport'
  | 'home_team'
  | 'away_team'
  | 'game_time'
  | 'market_type'
  | 'sportsbook'
  | 'home_odds'
  | 'away_odds'
  | 'spread'
  | 'total'
  | 'external_id'
  | 'updated_at'
>;

/** Same nested shape as GET /functions/v1/fetch-odds JSON `games` */
export interface OddsApiGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  odds: Record<
    string,
    Record<string, { home: number | null; away: number | null; spread?: number; total?: number }>
  >;
}

export function oddsRowsToApiGames(rows: OddsSelectRow[]): OddsApiGame[] {
  const gamesMap = new Map<
    string,
    {
      id: string;
      sport: string;
      homeTeam: string;
      awayTeam: string;
      gameTime: string;
      odds: Record<
        string,
        Record<string, { home: number | null; away: number | null; spread?: number; total?: number }>
      >;
    }
  >();

  for (const record of rows) {
    const key = `${record.external_id ?? 'unknown'}-${record.home_team}-${record.away_team}`;

    if (!gamesMap.has(key)) {
      gamesMap.set(key, {
        id: record.external_id ?? key,
        sport: record.sport,
        homeTeam: record.home_team,
        awayTeam: record.away_team,
        gameTime: record.game_time,
        odds: {},
      });
    }

    const game = gamesMap.get(key)!;

    if (!game.odds[record.market_type]) {
      game.odds[record.market_type] = {};
    }

    game.odds[record.market_type][record.sportsbook] = {
      home: record.home_odds,
      away: record.away_odds,
      spread: record.spread ?? undefined,
      total: record.total ?? undefined,
    };
  }

  return Array.from(gamesMap.values());
}

export function maxUpdatedAtFromRows(rows: OddsSelectRow[]): Date | null {
  let maxMs = 0;
  for (const r of rows) {
    if (r.updated_at) {
      const t = new Date(r.updated_at).getTime();
      if (!Number.isNaN(t)) maxMs = Math.max(maxMs, t);
    }
  }
  return maxMs > 0 ? new Date(maxMs) : null;
}

export async function fetchOddsRows(supabase: SupabaseClient<Database>): Promise<OddsSelectRow[]> {
  const { data, error } = await supabase
    .from('odds')
    .select(
      'sport, home_team, away_team, game_time, market_type, sportsbook, home_odds, away_odds, spread, total, external_id, updated_at'
    )
    .gte('game_time', new Date().toISOString())
    .order('game_time', { ascending: true });

  if (error) throw error;
  return (data ?? []) as OddsSelectRow[];
}

const FETCH_ODDS_PATH = '/functions/v1/fetch-odds';

export async function refreshOddsViaEdgeFunction(): Promise<{ games: OddsApiGame[]; updated: string }> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const apiUrl = `${baseUrl}${FETCH_ODDS_PATH}`;
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch odds');
  }

  const data = (await response.json()) as { games?: OddsApiGame[]; updated?: string; error?: string };
  if (data.error) {
    throw new Error(data.error);
  }
  return {
    games: data.games ?? [],
    updated: data.updated ?? new Date().toISOString(),
  };
}
