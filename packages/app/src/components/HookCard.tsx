'use client';
import { useState } from 'react';
import { Copy, Heart, Check } from 'lucide-react';
import { ScoreMeter } from './ui/score-meter';
import { TypeBadge, PlatformBadge } from './ui/type-badge';
import type { GeneratedHook } from '@/lib/api';

interface HookCardProps {
  hook: GeneratedHook;
  onFavorite?: (id: string) => void;
}

/**
 * HookCard — the product's atomic unit. A generated hook with its charge-up
 * score, formula + platform tags, a spring-loaded favorite heart, and a copy
 * button that sweeps to a checkmark. Self-manages copied/favorited UI.
 */
export function HookCard({ hook, onFavorite }: HookCardProps) {
  const [copied, setCopied] = useState(false);
  const [faved, setFaved] = useState(hook.isFavorite ?? false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(hook.text); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const toggleFav = () => {
    setFaved(v => !v);
    if (hook.id) onFavorite?.(hook.id);
  };

  return (
    <div className="hg-hook">
      <div className="hg-hook__score"><ScoreMeter score={hook.score} /></div>
      <p className="hg-hook__text">{hook.text}</p>
      <div className="hg-hook__bar"><ScoreMeter score={hook.score} showPill={false} /></div>
      <div className="hg-hook__foot">
        <div className="hg-hook__tags">
          <TypeBadge type={hook.type} />
          <PlatformBadge platform={hook.platform} />
        </div>
        <div className="hg-hook__actions">
          <button className="hg-fav" data-on={faved} onClick={toggleFav} aria-pressed={faved} aria-label="Favorite">
            <Heart className="h-4 w-4" fill={faved ? 'currentColor' : 'none'} />
          </button>
          <button className="hg-copy" data-copied={copied} onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {hook.explanation && <p className="hg-hook__why">{hook.explanation}</p>}
    </div>
  );
}
