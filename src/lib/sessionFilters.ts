/** Filters persist for the life of the browser tab/session (cleared when the tab closes). */
const STORAGE_PREFIX = 'betting-portal:filters:';

export function readSessionFilter<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeSessionFilter<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}
