import type { OddsApiGame } from './oddsFromSupabase';

/**
 * Analysis-only debug instrumentation for the Low Hold odds board.
 *
 * TURN OFF:   set `VITE_ODDS_DEBUG=false` in .env, or flip ODDS_DEBUG_DEFAULT below.
 * REMOVE:     delete this file, OddsDebugPanel.tsx, and their imports in OddsBoard.tsx.
 *
 * When off, none of the snapshot data is captured and the panel never renders.
 */
const ODDS_DEBUG_DEFAULT = true;

export const ODDS_DEBUG: boolean = (() => {
  const flag = import.meta.env.VITE_ODDS_DEBUG;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return ODDS_DEBUG_DEFAULT;
})();

/** Which code path in performOddsLoad produced the displayed games. */
export type OddsLoadSource = 'api+db-merge' | 'db-fallback' | 'db-only';

/** Outcome of a load attempt. */
export type OddsLoadStatus = 'success' | 'failed' | 'aborted' | 'rate-limited';

/** One stage of the client-side filter funnel (loaded → rendered). */
export interface OddsFilterStage {
  label: string;
  /** Games still passing after this stage. */
  remaining: number;
  /** Games this stage removed. */
  dropped: number;
}

/** A snapshot of one odds load attempt, captured for the on-screen analysis panel. */
export interface OddsDebugInfo {
  /** How the attempt ended — recorded even when nothing was rendered. */
  status: OddsLoadStatus;
  /** Path that produced the data; null when the attempt failed/aborted early. */
  source: OddsLoadSource | null;
  loadedAt: string;
  forceLiveSync: boolean;
  dbOnly: boolean;
  silent: boolean;
  /** Whether the live edge function was actually called (vs skipped by the limiter). */
  edgeInvoked: boolean;
  /** Caught error message, if the live sync or DB read threw. */
  error: string | null;
  /** Raw payload from the edge function (null when that path wasn't taken). */
  apiGames: OddsApiGame[] | null;
  /** Raw payload read back from the database (null when not reached). */
  dbGames: OddsApiGame[] | null;
  /** What actually got rendered after merge/transform (empty on failure/abort). */
  appliedGames: OddsApiGame[];
}

function countBookEntries(games: OddsApiGame[]): number {
  let n = 0;
  for (const game of games) {
    for (const books of Object.values(game.odds)) {
      n += Object.keys(books).length;
    }
  }
  return n;
}

/** Build a snapshot and log it to the console (no-op caller side when ODDS_DEBUG is off). */
export function buildOddsDebugInfo(
  partial: Omit<OddsDebugInfo, 'loadedAt'>
): OddsDebugInfo {
  const info: OddsDebugInfo = { loadedAt: new Date().toISOString(), ...partial };
  // eslint-disable-next-line no-console
  console.groupCollapsed(
    `[odds] ${info.status} via ${info.source ?? 'n/a'} — ${info.appliedGames.length} games, ${countBookEntries(info.appliedGames)} book entries${info.error ? ` — ${info.error}` : ''}`
  );
  // eslint-disable-next-line no-console
  console.log(info);
  // eslint-disable-next-line no-console
  console.groupEnd();
  return info;
}

export { countBookEntries };
