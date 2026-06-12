'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, Copy, Check, Zap, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type TrendingHook } from '@/lib/api';

const PLATFORMS = [
  { id: '', label: 'All' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
];

const SOURCE_ICONS: Record<string, string> = {
  youtube: '▶',
  reddit: '⬆',
  twitter: '𝕏',
  manual: '✦',
};

const TYPE_COLORS: Record<string, string> = {
  curiosity: 'bg-blue-900/40 text-blue-300 border-blue-800',
  fear_fomo: 'bg-red-900/40 text-red-300 border-red-800',
  contrarian: 'bg-orange-900/40 text-orange-300 border-orange-800',
  pain_point: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  how_to: 'bg-green-900/40 text-green-300 border-green-800',
  list: 'bg-cyan-900/40 text-cyan-300 border-cyan-800',
  shocking_stat: 'bg-pink-900/40 text-pink-300 border-pink-800',
  story: 'bg-purple-900/40 text-purple-300 border-purple-800',
  question: 'bg-indigo-900/40 text-indigo-300 border-indigo-800',
};

interface TrendingHooksProps {
  isPro: boolean;
  isAuthenticated: boolean;
}

export function TrendingHooks({ isPro, isAuthenticated }: TrendingHooksProps) {
  const [hooks, setHooks] = useState<TrendingHook[]>([]);
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [planLimit, setPlanLimit] = useState<number | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.hooks.trending({
        platform: platform || undefined,
        limit: isPro ? 20 : 5,
      });
      setHooks(res.hooks);
      setPlanLimit(res.planLimit);
    } catch (err: any) {
      setError(err.message || 'Failed to load trending hooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [platform, isAuthenticated]);

  const copy = async (hook: TrendingHook) => {
    await navigator.clipboard.writeText(hook.text);
    setCopiedId(hook.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="py-12 text-center">
        <TrendingUp className="mx-auto mb-3 h-10 w-10 text-brand-500" />
        <p className="font-semibold text-zinc-100">Trending hooks, updated daily</p>
        <p className="mt-1 text-sm text-zinc-500">Sign up to see what's going viral right now</p>
        <a href="/register" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
          Get started free
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Platform filter */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              platform === p.id
                ? 'border-brand-500 bg-brand-900/50 text-brand-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Free plan teaser */}
      {!isPro && planLimit && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-800/60 bg-brand-900/20 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 text-brand-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-200">Showing {planLimit} of many trending hooks</p>
            <p className="text-xs text-zinc-500 mt-0.5">Upgrade to Pro for full access + niche filtering</p>
          </div>
          <a href="/pricing" className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors">
            Upgrade
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Hooks list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse" />
          ))}
        </div>
      ) : hooks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500">No trending hooks yet.</p>
          <p className="mt-1 text-xs text-zinc-600">The collection pipeline runs daily — check back tomorrow.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((hook, i) => (
            <div
              key={hook.id}
              className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
            >
              {/* Rank */}
              <div className="absolute -left-2 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-500">
                {i + 1}
              </div>

              <div className="pl-4">
                <p className="mb-3 pr-10 text-sm font-medium leading-relaxed text-zinc-100">{hook.text}</p>

                {/* Score bar */}
                <div className="mb-3 h-1 w-full rounded-full bg-zinc-800">
                  <div
                    className={cn('h-1 rounded-full', hook.score >= 88 ? 'bg-emerald-500' : hook.score >= 75 ? 'bg-yellow-500' : 'bg-zinc-600')}
                    style={{ width: `${hook.score}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      TYPE_COLORS[hook.hookType] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    )}>
                      {hook.hookType.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {SOURCE_ICONS[hook.sourceType] || '•'} {hook.platform}
                    </span>
                    {hook.viewCount && (
                      <span className="text-xs text-zinc-600">
                        {hook.viewCount >= 1000000
                          ? `${(hook.viewCount / 1000000).toFixed(1)}M views`
                          : `${(hook.viewCount / 1000).toFixed(0)}k`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Zap className="h-3 w-3 text-yellow-500" />{hook.score}
                    </div>
                    <button
                      onClick={() => copy(hook)}
                      className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                    >
                      {copiedId === hook.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      Copy
                    </button>
                  </div>
                </div>

                {hook.explanation && (
                  <p className="mt-2 text-xs text-zinc-600 italic">{hook.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
