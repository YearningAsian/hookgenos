'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { teardownHook, remixHook, type RemixVariant } from '@hookgenos/core';
import { ScoreMeter } from '@/components/ui/score-meter';
import { TypeBadge, PlatformBadge } from '@/components/ui/type-badge';
import { Icon } from './icon';
import { useStudio } from './StudioProvider';
import { useFocusTrap } from './useFocusTrap';
import { creatorOf } from '@/lib/studio/data';
import { platformLabel } from '@/lib/studio/taxonomy';
import type { StudioHook } from '@/lib/studio/types';

function factorTier(v: number): 'hot' | 'high' | 'mid' | 'low' {
  if (v >= 90) return 'hot';
  if (v >= 80) return 'high';
  if (v >= 70) return 'mid';
  return 'low';
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="td-factor">
      <div className="td-factor__row"><span>{label}</span><span className="td-factor__v">{value}</span></div>
      <div className="td-factor__track"><span className={`td-factor__fill is-${factorTier(value)}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export function TeardownDrawer({ hook, onClose }: { hook: StudioHook; onClose: () => void }) {
  const router = useRouter();
  const { boards, saveHook, createBoardAndSave, notify } = useStudio();
  const drawerRef = useRef<HTMLElement>(null);
  useFocusTrap(drawerRef);
  const [niche, setNiche] = useState('');
  const [remixed, setRemixed] = useState<RemixVariant[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const td = useMemo(() => teardownHook({ text: hook.text, type: hook.type, platform: hook.platform, score: hook.score }), [hook]);
  const creator = hook.creatorId ? creatorOf(hook.creatorId) : null;
  const sourceLabel = creator ? creator.handle : hook.sourceHandle ?? platformLabel(hook.platform);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const runRemix = () => {
    setBusy(true);
    // Synchronous engine; the brief delay reads as "working" and respects motion prefs.
    setTimeout(() => {
      setRemixed(remixHook({ text: hook.text, type: hook.type, platform: hook.platform, score: hook.score }, niche));
      setBusy(false);
    }, 450);
  };

  const save = () => {
    if (boards[0]) saveHook(hook, boards[0].id);
    else createBoardAndSave(hook);
  };

  const copyVariant = async (text: string, idx: number) => {
    try { await navigator.clipboard.writeText(text); } catch { /* unavailable */ }
    setCopiedIdx(idx);
    notify('Copied');
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1400);
  };

  return (
    <div className="td-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="td-drawer" role="dialog" aria-label="Hook teardown" aria-modal="true" ref={drawerRef} tabIndex={-1}>
        <header className="td-head">
          <div className="td-head__l"><Icon name="scan" size={16} /> Teardown</div>
          <button className="su-iconbtn" onClick={onClose} aria-label="Close teardown" type="button"><Icon name="x" size={18} /></button>
        </header>

        <div className="td-body">
          <div className="td-hero">
            <div className="td-hero__top">
              <ScoreMeter score={hook.score} />
              <span className="td-hero__creator">{sourceLabel}{hook.views ? ` · ${hook.views} views` : ''}</span>
            </div>
            <p className="td-hero__text">{hook.text}</p>
            <div className="td-hero__tags">
              <TypeBadge type={hook.type} />
              <PlatformBadge platform={hook.niche || platformLabel(hook.platform)} />
            </div>
          </div>

          <section className="td-sec">
            <h3 className="td-sec__h">Formula</h3>
            <div className="td-formula">
              <Icon name="zap" size={15} />
              <div><strong>{td.formula}</strong><span>Trigger — {td.trigger}</span></div>
            </div>
          </section>

          <section className="td-sec">
            <h3 className="td-sec__h">Anatomy</h3>
            <div className="td-anatomy">
              {td.structure.map((seg, i) => (
                <div key={i} className="td-anat">
                  <span className="td-anat__phrase">“{seg.phrase}”</span>
                  <span className="td-anat__role">{seg.role}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="td-sec">
            <h3 className="td-sec__h">Score factors</h3>
            <div className="td-factors">
              {td.factors.map((f) => <FactorBar key={f.label} label={f.label} value={f.value} />)}
            </div>
          </section>

          <section className="td-sec">
            <h3 className="td-sec__h">Why it works</h3>
            <p className="td-why">{td.why}</p>
          </section>

          <section className="td-sec td-remix">
            <h3 className="td-sec__h"><Icon name="wand" size={15} /> Remix to your niche</h3>
            <div className="td-remix__in">
              <input
                className="dz-search"
                value={niche}
                placeholder="e.g. fitness, SaaS, finance…"
                aria-label="Remix niche"
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runRemix(); }}
              />
              <button className="td-remix__go" onClick={runRemix} disabled={busy} type="button">
                {busy ? 'Remixing…' : <><Icon name="sparkles" size={14} /> Remix</>}
              </button>
            </div>
            {remixed && (
              <div className="td-remix__out">
                {remixed.map((r, i) => (
                  <div key={i} className="td-variant">
                    <p>{r.text}</p>
                    <div className="td-variant__foot">
                      <ScoreMeter score={r.score} />
                      <button className="su-teardown-btn" onClick={() => copyVariant(r.text, i)} type="button">
                        <Icon name={copiedIdx === i ? 'check' : 'copy'} size={13} /> {copiedIdx === i ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="td-foot">
          <button className="td-foot__save" onClick={save} type="button"><Icon name="bookmark" size={15} /> Save to board</button>
          <button className="td-foot__gen" onClick={() => { onClose(); router.push('/dashboard/generate'); }} type="button"><Icon name="bolt" size={15} /> Generate like this</button>
        </footer>
      </aside>
    </div>
  );
}
