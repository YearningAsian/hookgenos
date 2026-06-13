'use client';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/studio/icon';
import { ViewHead, Avatar, StudioHookCard } from '@/components/studio/shared';
import { useCardLayout } from '@/components/studio/useCardLayout';
import { useTracked } from '@/components/studio/useTracked';
import { CREATORS, LIBRARY, creatorOf } from '@/lib/studio/data';
import { platformLabel, TYPES } from '@/lib/studio/taxonomy';

function topFormula(types: string[]): string {
  if (types.length === 0) return '—';
  const counts = new Map<string, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return TYPES.find((t) => t.id === top)?.label ?? top;
}

export default function CreatorDetailPage() {
  const params = useParams<{ creatorId: string }>();
  const router = useRouter();
  const [layout] = useCardLayout();
  const { isTracked, toggle } = useTracked();

  const creator = CREATORS.find((c) => c.id === params.creatorId) ?? creatorOf(params.creatorId);
  const hooks = LIBRARY.filter((h) => h.creatorId === creator.id).sort((a, b) => b.score - a.score);
  const tracked = isTracked(creator.id);
  const cardLayout = layout === 'list' ? 'list' : 'grid';

  return (
    <div className="sp">
      <button className="su-back" onClick={() => router.push('/dashboard/spyder')} type="button">
        <Icon name="chevronRight" size={15} style={{ transform: 'rotate(180deg)' }} /> Spyder
      </button>

      <div className="sp-profile">
        <Avatar creator={creator} size={64} />
        <div className="sp-profile__id">
          <h1 className="sp-profile__name">{creator.name}</h1>
          <p className="sp-profile__handle">{creator.handle} · {platformLabel(creator.platform)} · {creator.followers} followers</p>
        </div>
        <button className={`sp-trackbtn ${tracked ? 'is-on' : ''}`} onClick={() => toggle(creator.id)} type="button">
          {tracked ? <><Icon name="check" size={15} /> Tracking</> : <><Icon name="plus" size={15} /> Track</>}
        </button>
      </div>

      <div className="sp-analytics">
        {[
          ['Avg hook score', String(creator.avgScore)],
          ['Hooks pulled', String(hooks.length)],
          ['Top formula', topFormula(hooks.map((h) => h.type))],
          ['Niche', creator.niche],
        ].map(([l, v]) => (
          <div key={l} className="sp-an"><span className="sp-an__v">{v}</span><span className="sp-an__l">{l}</span></div>
        ))}
      </div>

      <p className="sp-sectionlabel">Best openers, ranked</p>
      {hooks.length === 0 ? (
        <div className="su-empty"><Icon name="compass" size={26} /><p>No openers indexed for this creator yet.</p></div>
      ) : (
        <div className={`dz-feed dz-feed--${cardLayout}`}>
          {hooks.map((h) => <StudioHookCard key={h.id} hook={h} layout={cardLayout} />)}
        </div>
      )}
    </div>
  );
}
