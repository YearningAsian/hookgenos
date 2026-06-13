'use client';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Copy, Check, RotateCw, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { PillSelect } from './ui/pill-select';
import { ScoreMeter } from './ui/score-meter';
import { TypeBadge, PlatformBadge } from './ui/type-badge';
import { Bolt } from './ui/icons';
import { api, type TrendingHook } from '@/lib/api';
import { PLATFORMS as BASE_PLATFORMS, SOURCE_ICONS } from '@/lib/constants';

// Filter UI excludes 'general' and adds an "All" option.
const PLATFORMS = [{ id: '', label: 'All' }, ...BASE_PLATFORMS.filter(p => p.id !== 'general')];

interface TrendingHooksProps {
  isPro: boolean;
  isAuthenticated: boolean;
}

function formatViews(v: number | null): string | null {
  if (!v) return null;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M views`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k views`;
  return `${v} views`;
}

export function TrendingHooks({ isPro, isAuthenticated }: TrendingHooksProps) {
  const [hooks, setHooks] = useState<TrendingHook[]>([]);
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [planLimit, setPlanLimit] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.hooks.trending({ platform: platform || undefined, limit: isPro ? 20 : 5 });
      setHooks(res.hooks);
      setPlanLimit(res.planLimit);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to load trending hooks');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isPro, platform]);

  // Fetch on mount / param change; load() sets a loading flag synchronously.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const copy = async (hook: TrendingHook) => {
    try { await navigator.clipboard.writeText(hook.text); } catch { /* ignore */ }
    setCopiedId(hook.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <TrendingUp className="mx-auto mb-3 h-10 w-10 text-brand-500" />
        <p className="app__limit-t">Trending hooks, updated daily</p>
        <p className="app__limit-s">Sign up to see what&apos;s going viral right now</p>
        <a href="/register" className="hg-btn hg-btn--cta hg-btn--md" style={{ marginTop: 16, display: 'inline-flex' }}>
          <Bolt size={15} /> Get started free
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Platform filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <PillSelect aria-label="Platform filter" size="sm" value={platform} onChange={setPlatform} options={PLATFORMS} />
        <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>
          <RotateCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Free plan teaser */}
      {!isPro && planLimit && (
        <div className="app__upsell" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Sparkles className="mt-0.5 h-4 w-4 text-brand-400 shrink-0" />
            <div>
              <p className="app__upsell-t">Showing {planLimit} of many trending hooks</p>
              <p className="app__upsell-s">Upgrade to Pro for full access + niche filtering</p>
            </div>
          </div>
          <a href="/pricing" className="hg-btn hg-btn--cta hg-btn--sm">Upgrade</a>
        </div>
      )}

      {error && <div className="app__notice app__notice--error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="app__trending">
          {[...Array(5)].map((_, i) => <div key={i} className="hg-skel" style={{ height: 96 }} />)}
        </div>
      ) : hooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: 'var(--text-subtle)' }}>No trending hooks yet.</p>
          <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 4 }}>The collection pipeline runs daily — check back tomorrow.</p>
        </div>
      ) : (
        <div className="app__trending">
          {hooks.map((hook, i) => (
            <div key={hook.id} className="trend-row">
              <span className="trend-row__rank">{i + 1}</span>
              <div className="trend-row__body">
                <p className="trend-row__text">{hook.text}</p>
                <ScoreMeter score={hook.score} showPill={false} />
                <div className="trend-row__foot">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TypeBadge type={hook.hookType} />
                    <PlatformBadge platform={hook.platform} glyph={SOURCE_ICONS[hook.sourceType]} />
                    {formatViews(hook.viewCount) && (
                      <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{formatViews(hook.viewCount)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="trend-row__score"><Bolt size={12} /> {hook.score}</span>
                    <button className="hg-copy" data-copied={copiedId === hook.id} onClick={() => copy(hook)}>
                      {copiedId === hook.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy
                    </button>
                  </div>
                </div>
                {hook.explanation && <p className="hg-hook__why">{hook.explanation}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
