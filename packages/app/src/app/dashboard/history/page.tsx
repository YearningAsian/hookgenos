'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, Zap, ArrowLeft, Copy, Check, Filter } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, type GeneratedHook } from '@/lib/api';
import { fetchCurrentUser as fetchUser } from '@/lib/auth';
import Link from 'next/link';

const PLATFORMS = [
  { id: '', label: 'All platforms' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'general', label: 'General' },
];

export default function HistoryPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<GeneratedHook[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [platform, setPlatform] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUser().then(u => {
      if (!u) { router.push('/login'); return; }
      setAuthed(true);
    });
  }, [router]);

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const res = await api.hooks.history({ page, platform: platform || undefined, favorites: favOnly || undefined });
      setItems(res.items);
      setPages(res.pages);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [authed, page, platform, favOnly]);

  // Fetch on mount / param change; load() sets a loading flag synchronously,
  // which this heuristic rule flags.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const copy = async (item: GeneratedHook) => {
    await navigator.clipboard.writeText(item.text ?? '');
    setCopiedId(item.id!);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFav = async (item: GeneratedHook) => {
    await api.hooks.favorite(item.id!);
    setItems(prev => prev.map(h => h.id === item.id ? { ...h, isFavorite: !h.isFavorite } : h));
  };

  const del = async (id: string) => {
    await api.hooks.delete(id);
    setItems(prev => prev.filter(h => h.id !== id));
    setTotal(t => t - 1);
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-400">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Hook History</h1>
            <p className="text-sm text-zinc-500">{total} hooks total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-sm text-zinc-500">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setPage(1); }}
                className={cn(
                  'rounded-lg border px-3 py-1 text-xs font-medium transition-all',
                  platform === p.id
                    ? 'border-brand-500 bg-brand-900/50 text-brand-300'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setFavOnly(!favOnly); setPage(1); }}
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-all',
              favOnly
                ? 'border-pink-700 bg-pink-900/30 text-pink-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
            )}
          >
            <Heart className="h-3.5 w-3.5" fill={favOnly ? 'currentColor' : 'none'} />
            Favorites
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500">No hooks yet.{' '}
              <Link href="/dashboard" className="text-brand-400 hover:text-brand-300">Generate some →</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="flex-1 text-sm leading-relaxed text-zinc-200">{item.text}</p>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFav(item)}
                      className={cn('rounded p-1.5 transition-colors', item.isFavorite ? 'text-pink-400' : 'text-zinc-600 hover:text-zinc-400')}
                    >
                      <Heart className="h-3.5 w-3.5" fill={item.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => copy(item)}
                      className="rounded p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => del(item.id!)}
                      className="rounded p-1.5 text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                    {item.platform}
                  </span>
                  {item.type && (
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      {item.type}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1 text-xs text-zinc-600">
                    <Zap className="h-3 w-3" />{item.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-zinc-500">{page} / {pages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
