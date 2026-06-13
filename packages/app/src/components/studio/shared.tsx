'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ScoreMeter } from '@/components/ui/score-meter';
import { TypeBadge, PlatformBadge } from '@/components/ui/type-badge';
import { Icon } from './icon';
import { useStudio, type SaveableHook } from './StudioProvider';
import { creatorOf } from '@/lib/studio/data';
import { platformGlyph, platformLabel } from '@/lib/studio/taxonomy';
import type { Creator, StudioHook } from '@/lib/studio/types';

/* --------------------------------- Avatar -------------------------------- */
export function Avatar({ creator, size = 34 }: { creator: Creator; size?: number }) {
  const initials = creator.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <span
      className="su-av"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${creator.avatar} 22%, var(--zinc-900))`,
        color: creator.avatar,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </span>
  );
}

export function CreatorChip({ creator, onClick }: { creator: Creator; onClick?: () => void }) {
  return (
    <button className="su-creator" onClick={onClick} type="button">
      <Avatar creator={creator} size={22} />
      <span className="su-creator__name">{creator.handle}</span>
      <span className="su-creator__glyph">{platformGlyph(creator.platform)}</span>
    </button>
  );
}

/* ------------------------------ Segmented -------------------------------- */
export interface SegOption {
  id: string;
  label?: string;
  icon?: string;
  title?: string;
}
export function Seg({
  value, onChange, options, size = 'md',
}: { value: string; onChange: (id: string) => void; options: SegOption[]; size?: 'md' | 'sm' }) {
  return (
    <div className={`su-seg su-seg--${size}`} role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`su-seg__b ${value === o.id ? 'is-on' : ''}`}
          onClick={() => onChange(o.id)}
          title={o.title ?? o.label}
          aria-pressed={value === o.id}
          aria-label={o.title ?? o.label}
        >
          {o.icon ? <Icon name={o.icon} size={15} /> : null}
          {o.label ? <span>{o.label}</span> : null}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ SaveButton ------------------------------- */
export function SaveButton({ hook }: { hook: SaveableHook }) {
  const { boards, savedKeys, saveHook, createBoardAndSave } = useStudio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const saved = savedKeys.has(hook.text);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="su-save" ref={ref}>
      <button className="su-iconbtn" data-on={saved} onClick={() => setOpen((v) => !v)} aria-label="Save to board" aria-expanded={open} type="button">
        <Icon name="bookmark" size={16} fill={saved ? 'currentColor' : undefined} />
      </button>
      {open && (
        <div className="su-flyout">
          <div className="su-flyout__head">Save to board</div>
          {boards.length === 0 && <div className="su-flyout__empty">No boards yet.</div>}
          {boards.map((b) => (
            <button key={b.id} className="su-flyout__item" type="button" onClick={() => { saveHook(hook, b.id); setOpen(false); }}>
              <span className="su-dot" style={{ background: b.color }} />{b.name}
              <span className="su-flyout__count">{b.hookCount}</span>
            </button>
          ))}
          <button className="su-flyout__new" type="button" onClick={() => { createBoardAndSave(hook); setOpen(false); }}>
            <Icon name="plus" size={13} /> New board
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- ViewHead -------------------------------- */
export function ViewHead({
  icon, title, sub, right,
}: { icon?: string; title: ReactNode; sub?: string; right?: ReactNode }) {
  return (
    <div className="su-vhead">
      <div className="su-vhead__l">
        <h1 className="su-vhead__title">{icon ? <Icon name={icon} size={22} /> : null}{title}</h1>
        {sub ? <p className="su-vhead__sub">{sub}</p> : null}
      </div>
      {right ? <div className="su-vhead__r">{right}</div> : null}
    </div>
  );
}

/* ----------------------------- StudioHookCard ---------------------------- */
function CardMeta({ hook }: { hook: StudioHook }) {
  return (
    <div className="su-card__meta">
      {hook.views ? <span><Icon name="eye" size={13} /> {hook.views}</span> : null}
      {typeof hook.saves === 'number' ? <span><Icon name="bookmark" size={13} /> {hook.saves}</span> : null}
      {typeof hook.daysAgo === 'number' ? <span className="su-card__ago">{hook.daysAgo}d</span> : null}
    </div>
  );
}

export function StudioHookCard({ hook, layout = 'grid', onRemove }: { hook: StudioHook; layout?: 'grid' | 'masonry' | 'list'; onRemove?: () => void }) {
  const { openTeardown } = useStudio();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const creator = hook.creatorId ? creatorOf(hook.creatorId) : null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(hook.text); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const actions = (
    <div className="su-card__actions">
      <button className="su-iconbtn" onClick={copy} data-copied={copied} aria-label="Copy hook" type="button">
        <Icon name={copied ? 'check' : 'copy'} size={16} />
      </button>
      {onRemove
        ? <button className="su-iconbtn" onClick={onRemove} aria-label="Remove from board" type="button"><Icon name="x" size={16} /></button>
        : <SaveButton hook={hook} />}
      <button className="su-teardown-btn" onClick={() => openTeardown(hook)} type="button">
        <Icon name="scan" size={14} /> Teardown
      </button>
    </div>
  );

  if (layout === 'list') {
    return (
      <div className="su-row">
        <button className="su-row__hit" onClick={() => openTeardown(hook)} aria-label="Open teardown" type="button">
          <div className="su-row__score"><ScoreMeter score={hook.score} /></div>
          <div className="su-row__body">
            <p className="su-row__text">{hook.text}</p>
            <div className="su-row__tags">
              <TypeBadge type={hook.type} />
              {creator ? <PlatformBadge platform={creator.handle} /> : hook.sourceHandle ? <PlatformBadge platform={hook.sourceHandle} /> : <PlatformBadge platform={platformLabel(hook.platform)} />}
              <span className="su-row__niche">{hook.niche}</span>
            </div>
          </div>
        </button>
        <div className="su-row__right">
          <CardMeta hook={hook} />
          {actions}
        </div>
      </div>
    );
  }

  return (
    <div className={`su-card su-card--${layout}`}>
      <div className="su-card__top">
        {creator
          ? <CreatorChip creator={creator} onClick={() => router.push(`/dashboard/spyder/${creator.id}`)} />
          : <span className="su-creator"><span className="su-creator__name">{hook.sourceHandle ?? platformLabel(hook.platform)}</span><span className="su-creator__glyph">{platformGlyph(hook.platform)}</span></span>}
        <ScoreMeter score={hook.score} />
      </div>
      <p className="su-card__text">{hook.text}</p>
      <div className="su-card__charge"><ScoreMeter score={hook.score} showPill={false} /></div>
      <div className="su-card__tags">
        <TypeBadge type={hook.type} />
        <span className="su-row__niche">{hook.niche}</span>
      </div>
      <div className="su-card__foot">
        <CardMeta hook={hook} />
        {actions}
      </div>
    </div>
  );
}
