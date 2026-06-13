'use client';
import { useEffect, useState } from 'react';

export type CardLayout = 'grid' | 'masonry' | 'list';
const KEY = 'hg.studio.layout';

/**
 * Shared swipe-card layout preference (grid / masonry / list), persisted to
 * localStorage so Discover, Board detail and Creator detail stay in sync. Starts
 * at 'masonry' on the server and hydrates the stored value after mount.
 */
export function useCardLayout(): [CardLayout, (l: CardLayout) => void] {
  const [layout, setLayout] = useState<CardLayout>('masonry');

  // Hydrate the stored preference once on mount (external-system sync).
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY) as CardLayout | null;
      if (v === 'grid' || v === 'masonry' || v === 'list') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLayout(v);
      }
    } catch { /* ignore */ }
  }, []);

  const set = (l: CardLayout) => {
    setLayout(l);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  };

  return [layout, set];
}
