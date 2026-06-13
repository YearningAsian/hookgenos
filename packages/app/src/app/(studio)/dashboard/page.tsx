'use client';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScoreMeter } from '@/components/ui/score-meter';
import { TypeBadge } from '@/components/ui/type-badge';
import { Icon } from '@/components/studio/icon';
import { ViewHead, Seg, StudioHookCard } from '@/components/studio/shared';
import { useStudio } from '@/components/studio/StudioProvider';
import { useCardLayout } from '@/components/studio/useCardLayout';
import { LIBRARY } from '@/lib/studio/data';
import { PLATFORMS, TYPES, NICHES } from '@/lib/studio/taxonomy';
import { api, type TrendingHook } from '@/lib/api';
import { formatViews } from '@/lib/studio/format';
import type { StudioHook } from '@/lib/studio/types';

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="dz-fgroup">
      <div className="dz-fgroup__label">{label}</div>
      <div className="dz-fgroup__body">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={`dz-chip ${on ? 'is-on' : ''}`} onClick={onClick} aria-pressed={on}>{children}</button>;
}

function trendingToHook(t: TrendingHook): StudioHook {
  return {
    id: t.id,
    text: t.text,
    type: t.hookType,
    platform: t.platform,
    niche: t.niche ?? 'Trending',
    score: t.score,
    views: formatViews(t.viewCount),
    explanation: t.explanation ?? undefined,
  };
}

export default function DiscoverPage() {
  const { openTeardown } = useStudio();
  const [layout, setLayout] = useCardLayout();
  const [q, setQ] = useState('');
  const [plats, setPlats] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [niche, setNiche] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState('score');
  const [trending, setTrending] = useState<TrendingHook[]>([]);

  useEffect(() => {
    api.hooks.trending({ limit: 8 }).then((r) => setTrending(r.hooks)).catch(() => setTrending([]));
  }, []);

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    if (n.has(val)) n.delete(val); else n.add(val);
    setter(n);
  };
  const reset = () => { setPlats(new Set()); setTypes(new Set()); setNiche(null); setMinScore(0); setQ(''); };
  const activeCount = plats.size + types.size + (niche ? 1 : 0) + (minScore ? 1 : 0);

  const results = useMemo(() => {
    const ql = q.toLowerCase();
    let r = LIBRARY.filter((h) =>
      (!q || h.text.toLowerCase().includes(ql)) &&
      (plats.size === 0 || plats.has(h.platform)) &&
      (types.size === 0 || types.has(h.type)) &&
      (!niche || h.niche === niche) &&
      h.score >= minScore,
    );
    if (sort === 'score') r = [...r].sort((a, b) => b.score - a.score);
    else if (sort === 'saves') r = [...r].sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0));
    else r = [...r].sort((a, b) => (a.daysAgo ?? 0) - (b.daysAgo ?? 0));
    return r;
  }, [q, plats, types, niche, minScore, sort]);

  return (
    <div className="dz">
      <ViewHead
        icon="compass"
        title="Discover"
        sub="A living swipe file of hooks that are working right now — filter, study, steal."
        right={<Badge variant="secondary">{LIBRARY.length} curated hooks</Badge>}
      />

      {trending.length > 0 && (
        <div className="dz-trending">
          <p className="dz-trending__head"><Icon name="flame" size={14} /> Trending now</p>
          <div className="dz-trending__row">
            {trending.map((t) => {
              const hook = trendingToHook(t);
              return (
                <button key={t.id} type="button" className="dz-trend" onClick={() => openTeardown(hook)}>
                  <p className="dz-trend__text">{t.text}</p>
                  <div className="dz-trend__foot"><TypeBadge type={t.hookType} /><ScoreMeter score={t.score} /></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="dz-searchbar">
        <Icon name="search" size={18} />
        <input
          className="dz-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hooks, angles, phrases — try “stop scrolling”…"
          aria-label="Search hooks"
        />
        {q ? <button className="dz-search__clear" onClick={() => setQ('')} aria-label="Clear search" type="button"><Icon name="x" size={15} /></button> : null}
      </div>

      <div className="dz-grid">
        <aside className="dz-rail">
          <div className="dz-rail__head">
            <span><Icon name="filter" size={15} /> Filters{activeCount ? ` · ${activeCount}` : ''}</span>
            {activeCount ? <button className="dz-reset" onClick={reset} type="button">Clear</button> : null}
          </div>
          <FilterGroup label="Platform">
            {PLATFORMS.map((p) => (
              <Chip key={p.id} on={plats.has(p.id)} onClick={() => toggle(plats, p.id, setPlats)}>
                <span className="dz-glyph">{p.glyph}</span>{p.label}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Hook formula">
            {TYPES.map((t) => <Chip key={t.id} on={types.has(t.id)} onClick={() => toggle(types, t.id, setTypes)}>{t.label}</Chip>)}
          </FilterGroup>
          <FilterGroup label="Niche">
            <select className="dz-select" value={niche ?? ''} onChange={(e) => setNiche(e.target.value || null)} aria-label="Niche">
              <option value="">All niches</option>
              {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </FilterGroup>
          <FilterGroup label={`Min score · ${minScore}`}>
            <input type="range" className="dz-range" min={0} max={95} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} aria-label="Minimum score" />
          </FilterGroup>
        </aside>

        <section className="dz-results">
          <div className="dz-results__bar">
            <span className="dz-results__count"><strong>{results.length}</strong> hooks</span>
            <div className="dz-results__tools">
              <Seg size="sm" value={sort} onChange={setSort} options={[
                { id: 'score', label: 'Top' }, { id: 'saves', label: 'Saved' }, { id: 'recent', label: 'New' },
              ]} />
              <Seg size="sm" value={layout} onChange={(v) => setLayout(v as 'grid' | 'masonry' | 'list')} options={[
                { id: 'grid', icon: 'grid', title: 'Grid' }, { id: 'masonry', icon: 'masonry', title: 'Masonry' }, { id: 'list', icon: 'list', title: 'List' },
              ]} />
            </div>
          </div>

          {results.length === 0 ? (
            <div className="su-empty">
              <Icon name="search" size={28} />
              <p>No hooks match those filters.</p>
              <button className="dz-reset" onClick={reset} type="button">Clear filters</button>
            </div>
          ) : (
            <div className={`dz-feed dz-feed--${layout}`}>
              {results.map((h) => <StudioHookCard key={h.id} hook={h} layout={layout} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
