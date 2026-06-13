'use client';
import { useState } from 'react';
import { ScoreMeter } from '@/components/ui/score-meter';
import { TypeBadge } from '@/components/ui/type-badge';
import { Icon } from '@/components/studio/icon';
import { ViewHead } from '@/components/studio/shared';
import { useStudio } from '@/components/studio/StudioProvider';
import { sampleHookForPlatform } from '@/lib/studio/data';
import { platformGlyph, platformLabel } from '@/lib/studio/taxonomy';
import type { StudioHook } from '@/lib/studio/types';

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('tiktok')) return 'tiktok';
  if (u.includes('youtube') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram')) return 'instagram';
  if (u.includes('linkedin')) return 'linkedin';
  if (u.includes('x.com') || u.includes('twitter')) return 'twitter';
  return 'tiktok';
}

type RipState = 'idle' | 'ripping' | 'done';

export default function RipperPage() {
  const { openTeardown, saveHook, createBoardAndSave, boards, notify } = useStudio();
  const [url, setUrl] = useState('');
  const [state, setState] = useState<RipState>('idle');
  const [result, setResult] = useState<StudioHook | null>(null);
  const [platform, setPlatform] = useState('tiktok');

  const rip = () => {
    setState('ripping');
    const detected = detectPlatform(url);
    setPlatform(detected);
    setTimeout(() => {
      setResult(sampleHookForPlatform(detected));
      setState('done');
    }, 1100);
  };

  const save = () => {
    if (!result) return;
    if (boards[0]) saveHook(result, boards[0].id);
    else createBoardAndSave(result);
  };

  return (
    <div className="rp">
      <ViewHead
        icon="link"
        title="Ripper"
        sub="Paste any TikTok, Reel, Short, or X post. We pull the hook, transcribe the open, and tear it down."
        right={<span className="su-demo"><Icon name="scan" size={12} /> Demo extraction</span>}
      />

      <div className="rp-inputcard">
        <div className="rp-input">
          <Icon name="link" size={18} />
          <input className="dz-search" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tiktok.com/@creator/video/…" aria-label="Video URL" onKeyDown={(e) => e.key === 'Enter' && url.trim() && rip()} />
        </div>
        <button className="rp-rip" onClick={rip} disabled={state === 'ripping' || !url.trim()} type="button">
          {state === 'ripping' ? 'Ripping…' : <><Icon name="scan" size={16} /> Rip hook</>}
        </button>
      </div>

      {state === 'idle' && (
        <div className="rp-hint">
          <div className="rp-thumb"><Icon name="play" size={26} /><span>video preview</span></div>
          <p>Drop a link to extract its opening hook and see exactly why it stops the scroll. This is a curated demo — live transcription is coming.</p>
        </div>
      )}

      {state === 'ripping' && <div className="rp-loading"><span className="rp-bar" /><p>Transcribing the first 3 seconds…</p></div>}

      {state === 'done' && result && (
        <div className="rp-result">
          <div className="rp-thumb rp-thumb--lit">
            <Icon name="play" size={26} />
            <span className="rp-thumb__plat">{platformGlyph(platform)} {platformLabel(platform)} · 0:14</span>
          </div>
          <div className="rp-extracted">
            <div className="rp-extracted__label"><Icon name="sparkles" size={14} /> Extracted hook</div>
            <p className="rp-extracted__text">{result.text}</p>
            <div className="rp-extracted__tags"><TypeBadge type={result.type} /><ScoreMeter score={result.score} /></div>
            <div className="rp-transcript">
              <span>Transcript</span>
              “{result.text} …and the second you understand this, your retention curve flattens out instead of falling off a cliff.”
            </div>
            <div className="rp-actions">
              <button className="su-teardown-btn" onClick={() => openTeardown(result)} type="button"><Icon name="scan" size={14} /> Full teardown</button>
              <button className="su-teardown-btn" onClick={save} type="button"><Icon name="bookmark" size={14} /> Save</button>
              <button className="su-teardown-btn" onClick={() => { navigator.clipboard?.writeText(result.text).catch(() => {}); notify('Copied'); }} type="button"><Icon name="copy" size={14} /> Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
