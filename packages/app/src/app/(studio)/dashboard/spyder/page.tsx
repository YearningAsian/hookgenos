'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/studio/icon';
import { ViewHead, Avatar } from '@/components/studio/shared';
import { useStudio } from '@/components/studio/StudioProvider';
import { useTracked } from '@/components/studio/useTracked';
import { CREATORS } from '@/lib/studio/data';
import { platformLabel } from '@/lib/studio/taxonomy';
import type { Creator } from '@/lib/studio/types';

function CreatorRow({ creator, onOpen }: { creator: Creator; onOpen: () => void }) {
  return (
    <button className="sp-row" onClick={onOpen} type="button">
      <Avatar creator={creator} size={42} />
      <div className="sp-row__id">
        <div className="sp-row__name">{creator.name}{creator.newCount ? <span className="sp-new">{creator.newCount} new</span> : null}</div>
        <div className="sp-row__handle">{creator.handle} · {platformLabel(creator.platform)} · {creator.followers}</div>
      </div>
      <div className="sp-row__stats">
        <div className="sp-stat"><span className="sp-stat__v">{creator.avgScore}</span><span className="sp-stat__l">avg score</span></div>
        <div className="sp-stat"><span className="sp-stat__v">{creator.niche}</span><span className="sp-stat__l">niche</span></div>
      </div>
      <Icon name="chevronRight" size={18} />
    </button>
  );
}

export default function SpyderPage() {
  const router = useRouter();
  const { notify } = useStudio();
  const { isTracked } = useTracked();
  const [url, setUrl] = useState('');

  const tracked = CREATORS.filter((c) => isTracked(c.id));
  const suggested = CREATORS.filter((c) => !isTracked(c.id));
  const open = (id: string) => router.push(`/dashboard/spyder/${id}`);

  const addCreator = () => {
    setUrl('');
    notify('Demo — the creator catalog is curated');
  };

  return (
    <div className="sp">
      <ViewHead
        icon="radar"
        title="Spyder"
        sub="Track any creator or brand. We pull their best openers automatically and ping you when a new one hits."
        right={<span className="su-demo"><Icon name="radar" size={12} /> Demo data</span>}
      />

      <div className="sp-add">
        <Icon name="radar" size={18} />
        <input className="dz-search" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a profile — @handle, TikTok, or YouTube URL…" aria-label="Track a creator" />
        <button className="td-remix__go" onClick={addCreator} type="button"><Icon name="plus" size={14} /> Track</button>
      </div>

      <p className="sp-sectionlabel">Tracking · {tracked.length}</p>
      <div className="sp-list">
        {tracked.length === 0 && <div className="su-empty"><Icon name="radar" size={26} /><p>Not tracking anyone yet — pick from the suggestions below.</p></div>}
        {tracked.map((c) => <CreatorRow key={c.id} creator={c} onOpen={() => open(c.id)} />)}
      </div>

      <p className="sp-sectionlabel">Suggested for your niches</p>
      <div className="sp-list">
        {suggested.map((c) => <CreatorRow key={c.id} creator={c} onOpen={() => open(c.id)} />)}
      </div>
    </div>
  );
}
