import { useCallback, useEffect, useState } from 'react';

/**
 * Minimal pathname + navigate without react-router.
 * Uses the History API so in-app links avoid full reloads.
 */
export function useBrowserPath() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  const navigate = useCallback((to: string, replace = false) => {
    if (replace || window.location.pathname === to) window.history.replaceState({}, '', to);
    else window.history.pushState({}, '', to);
    setPathname(to);
  }, []);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return { pathname, navigate };
}
