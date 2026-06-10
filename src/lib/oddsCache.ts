import type { GameOdds } from '../data/mockOdds';

/**
 * Caches the loaded odds for the life of the browser tab so navigating back to
 * Low Hold shows the last snapshot instantly instead of flashing a spinner.
 * Cleared when the tab closes.
 */
const GAMES_KEY = 'betting-portal:oddsCache:games';
const PULLED_KEY = 'betting-portal:oddsCache:pulledThisSession';

/** True once a live API pull has been attempted in this tab session. */
export function hasPulledOddsThisSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(PULLED_KEY) === '1';
}

export function markOddsPulledThisSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PULLED_KEY, '1');
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function readCachedGames(): GameOdds[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GAMES_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Array<Omit<GameOdds, 'gameTime'> & { gameTime: string }>;
    // gameTime serializes to an ISO string — revive it back to a Date.
    return parsed.map((g) => ({ ...g, gameTime: new Date(g.gameTime) }));
  } catch {
    return null;
  }
}

export function writeCachedGames(games: GameOdds[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(GAMES_KEY, JSON.stringify(games));
  } catch {
    /* storage unavailable / quota — non-fatal */
  }
}
