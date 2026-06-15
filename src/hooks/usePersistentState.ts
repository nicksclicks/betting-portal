import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/**
 * Drop-in replacement for useState that persists the value to sessionStorage,
 * keyed by `key`. This keeps form inputs alive when a component unmounts (e.g.
 * switching tabs) and across page reloads for the duration of the browser
 * session. The stored value is cleared automatically when the session ends.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // Ignore read/parse errors and fall back to the initial value.
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors (e.g. storage full or unavailable).
    }
  }, [key, value]);

  return [value, setValue];
}
