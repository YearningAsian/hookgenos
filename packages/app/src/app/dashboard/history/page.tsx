'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ArrowLeft, Copy, Check, Filter } from 'lucide-react';
import { AppNav } from '@/components/AppNav';
import { Button } from '@/components/ui/button';
import { Bolt } from '@/components/ui/icons';
import { PillSelect } from '@/components/ui/pill-select';
import { PlatformBadge, TypeBadge } from '@/components/ui/type-badge';
import { api, type GeneratedHook } from '@/lib/api';
import { fetchCurrentUser as fetchUser } from '@/lib/auth';
import Link from 'next/link';
import { PLATFORMS as BASE_PLATFORMS } from '@/lib/constants';

const PLATFORMS = [{ id: '', label: 'All platforms' }, ...BASE_PLATFORMS];

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
    <div>
      <AppNav />
      <main className="page page--wide">
        <div className="page__head" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
          <div>
            <h1 className="page__title">Hook history</h1>
            <p className="page__sub">{total} hooks total</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>
          <PillSelect
            aria-label="Platform"
            size="sm"
            value={platform}
            onChange={id => { setPlatform(id); setPage(1); }}
            options={PLATFORMS}
          />
          <Button
            variant={favOnly ? 'secondary' : 'ghost'}
            size="sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => { setFavOnly(!favOnly); setPage(1); }}
          >
            <Heart className="h-3.5 w-3.5" fill={favOnly ? 'currentColor' : 'none'} />
            Favorites
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="hg-skel" style={{ height: 96 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500">No hooks yet.{' '}
              <Link href="/dashboard" className="text-brand-400 hover:text-brand-300">Generate some →</Link>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} className="history-row">
                <div className="history-row__top">
                  <p className="history-row__text">{item.text}</p>
                  <div className="history-row__actions">
                    <button
                      className="history-row__btn history-row__btn--fav"
                      data-on={item.isFavorite}
                      onClick={() => toggleFav(item)}
                    >
                      <Heart className="h-3.5 w-3.5" fill={item.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className="history-row__btn"
                      onClick={() => copy(item)}
                    >
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      className="history-row__btn history-row__btn--del"
                      onClick={() => del(item.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="history-row__meta">
                  <PlatformBadge platform={item.platform} />
                  {item.type && <TypeBadge type={item.type} />}
                  <span className="history-row__score"><Bolt size={12} /> {item.score}</span>
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
