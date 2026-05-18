/** Persisted so refresh / revisit shares the same cooldown for this browser. */
const STORAGE_KEY = 'betting-portal:lastOddsEdgeSync';

/** Minimum time between calls to the fetch-odds edge function (per browser). */
export const ODDS_EDGE_SYNC_COOLDOWN_MS = 60_000;

export function readLastOddsEdgeSync(): Date | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function writeLastOddsEdgeSync(date: Date): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, date.toISOString());
}

export function canInvokeOddsEdgeSync(): boolean {
  const last = readLastOddsEdgeSync();
  if (!last) return true;
  return Date.now() - last.getTime() >= ODDS_EDGE_SYNC_COOLDOWN_MS;
}
