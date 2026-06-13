'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PillSelect } from '@/components/ui/pill-select';
import { Bolt } from '@/components/ui/icons';
import { HookCard } from '@/components/HookCard';
import { Icon } from '@/components/studio/icon';
import { ViewHead } from '@/components/studio/shared';
import { useStudio } from '@/components/studio/StudioProvider';
import { api, type GeneratedHook } from '@/lib/api';
import { PLATFORMS, TONES } from '@/lib/constants';
import type { StudioHook } from '@/lib/studio/types';

const COUNT_OPTIONS = (isPro: boolean) => [
  { id: '3', label: '3' },
  { id: '5', label: '5' },
  { id: '7', label: '7', disabled: !isPro, suffix: !isPro ? 'Pro' : undefined },
  { id: '10', label: '10', disabled: !isPro, suffix: !isPro ? 'Pro' : undefined },
];

function toStudioHook(h: GeneratedHook, i: number, niche: string): StudioHook {
  return {
    id: h.id ?? `gen${i}`,
    text: h.text,
    type: h.type,
    platform: h.platform,
    niche: niche || 'Content',
    score: h.score,
    explanation: h.explanation,
  };
}

function GenCard({ hook }: { hook: StudioHook }) {
  const { openTeardown } = useStudio();
  return (
    <div className="gn-genwrap">
      <HookCard hook={{ id: hook.id, text: hook.text, type: hook.type, score: hook.score, platform: hook.platform, explanation: hook.explanation }} />
      <button className="gn-teardown" onClick={() => openTeardown(hook)} type="button"><Icon name="scan" size={13} /> Teardown</button>
    </div>
  );
}

export default function GeneratePage() {
  const { isPro } = useStudio();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [tone, setTone] = useState('bold');
  const [niche, setNiche] = useState('');
  const [count, setCount] = useState(5);
  const [useAI, setUseAI] = useState(false);
  const [hooks, setHooks] = useState<StudioHook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  const generate = async () => {
    if (!topic.trim()) { setError('Enter a topic first'); return; }
    setError('');
    setLimitReached(false);
    setLoading(true);
    try {
      const result = await api.hooks.generate({ topic, platform, tone, niche: niche || undefined, count, useAI });
      setHooks(result.hooks.map((h, i) => toStudioHook(h, i, niche)));
    } catch (err: unknown) {
      const e = err as { data?: { limitReached?: boolean }; message?: string };
      if (e?.data?.limitReached) setLimitReached(true);
      else setError(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gn">
      <ViewHead
        icon="bolt"
        title="Generate"
        sub="60+ psychological formulas, tuned per platform and scored 0–100."
        right={
          <>
            <Link href="/dashboard/history" className="su-teardown-btn"><Icon name="history" size={14} /> History</Link>
            <Badge variant={isPro ? 'pro' : 'secondary'}>{isPro ? '✦ Pro' : 'Free · 10/day'}</Badge>
          </>
        }
      />

      <div className="gn-panel">
        <div className="gen__field">
          <label className="gen__label" htmlFor="gen-topic">What&apos;s your hook about?</label>
          <Input id="gen-topic" inputSize="lg" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. building a side hustle, losing 20 pounds…" onKeyDown={(e) => e.key === 'Enter' && generate()} />
        </div>

        <div className="gen__field">
          <label className="gen__label">Platform</label>
          <PillSelect aria-label="Platform" value={platform} onChange={setPlatform} options={PLATFORMS} />
        </div>

        <div className="gen__two">
          <div>
            <label className="gen__label">Tone</label>
            <PillSelect aria-label="Tone" size="sm" value={tone} onChange={setTone} options={TONES} />
          </div>
          <div>
            <label className="gen__label" htmlFor="gen-niche">Niche <span style={{ color: 'var(--text-faint)' }}>(optional)</span></label>
            <Input id="gen-niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. fitness, SaaS, cooking…" />
          </div>
        </div>

        <div className="gen__controls">
          <div className="gen__count">
            <span className="gen__label" style={{ margin: 0 }}>Hooks:</span>
            <PillSelect aria-label="Number of hooks" size="sm" value={String(count)} onChange={(v) => setCount(Number(v))} options={COUNT_OPTIONS(isPro)} />
          </div>
          {isPro && (
            <label className="gen__ai">
              <Switch checked={useAI} onChange={setUseAI} aria-label="AI-powered generation" />
              <span onClick={() => setUseAI(!useAI)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}><Bolt size={14} /> AI-powered</span>
            </label>
          )}
          <Button variant="cta" onClick={generate} disabled={loading || !topic.trim()} className="gen__go">
            {loading ? 'Firing…' : <><Bolt size={15} /> Generate</>}
          </Button>
        </div>

        {error && (
          <div className="app__notice app__notice--error" style={{ marginTop: 16 }}>
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {limitReached && (
          <div className="app__limit" style={{ marginTop: 16 }}>
            <Bolt size={28} className="mx-auto text-brand-400" />
            <p className="app__limit-t">Daily limit reached</p>
            <p className="app__limit-s">Free plan: 10 hooks/day. Upgrade to Pro for unlimited.</p>
            <a href="/pricing" className="hg-btn hg-btn--cta hg-btn--md" style={{ marginTop: 12, display: 'inline-flex' }}>Upgrade to Pro</a>
          </div>
        )}

        {hooks.length > 0 && (
          <div className="gen__results">
            <div className="gen__results-head">
              <strong>{hooks.length} hooks generated</strong>
              <span>Open a teardown or save any hook</span>
            </div>
            <div className="dz-feed dz-feed--grid">
              {hooks.map((h) => <GenCard key={h.id} hook={h} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
