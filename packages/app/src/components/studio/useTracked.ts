'use client';
import { useCallback, useEffect, useState } from 'react';
import { CREATORS } from '@/lib/studio/data';

const KEY = 'hg.studio.tracked';

function defaults(): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  CREATORS.forEach((c) => { m[c.id] = c.tracked; });
  return m;
}

/**
 * Spyder track state. The creator catalog is curated (there's no live scraping
 * backend), so a user's track/untrack choices persist to localStorage rather
 * than a server. Seeded from each creator's default `tracked` flag.
 */
export function useTracked() {
  const [map, setMap] = useState<Record<string, boolean>>(defaults);

  // Hydrate persisted track state once on mount (external-system sync).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMap({ ...defaults(), ...JSON.parse(raw) });
      }
    } catch { /* ignore */ }
  }, []);

  const toggle = useCallback((id: string) => {
    setMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const isTracked = useCallback((id: string) => !!map[id], [map]);
  return { isTracked, toggle };
}
