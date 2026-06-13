'use client';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { PillSelect } from './ui/pill-select';
import { Bolt } from './ui/icons';
import { HookCard } from './HookCard';
import { api, type GeneratedHook } from '@/lib/api';
import { useToast } from './ui/toast';
import { PLATFORMS, TONES } from '@/lib/constants';

interface HookGeneratorProps {
  isPro?: boolean;
  isAuthenticated?: boolean;
}

const COUNT_OPTIONS = (isPro: boolean) => [
  { id: '3', label: '3' },
  { id: '5', label: '5' },
  { id: '7', label: '7', disabled: !isPro, suffix: !isPro ? 'Pro' : undefined },
  { id: '10', label: '10', disabled: !isPro, suffix: !isPro ? 'Pro' : undefined },
];

// Curated examples shown in the no-account marketing demo (real hooks, not AI claims).
const DEMO_HOOKS: GeneratedHook[] = [
  { text: 'Stop scrolling — this is the side-hustle advice I wish I had at 22', type: 'fear_fomo', platform: 'TikTok', score: 94, explanation: 'Urgency command + regret trigger + age specificity.' },
  { text: 'I analyzed 500 viral posts. They all open the exact same way.', type: 'shocking_stat', platform: 'LinkedIn', score: 91 },
  { text: 'Unpopular opinion: posting more is why your account is stuck', type: 'contrarian', platform: 'Instagram', score: 88 },
  { text: 'The one thing nobody tells you about building an audience', type: 'curiosity', platform: 'YouTube', score: 86 },
  { text: '5 hooks that doubled my watch time (steal them)', type: 'list', platform: 'TikTok', score: 84 },
  { text: "Here's why your first 3 seconds sabotage every video you post", type: 'pain_point', platform: 'YouTube', score: 82 },
];

export function HookGenerator({ isPro = false, isAuthenticated = false }: HookGeneratorProps) {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [tone, setTone] = useState('bold');
  const [niche, setNiche] = useState('');
  const [count, setCount] = useState(5);
  const [useAI, setUseAI] = useState(false);
  const [hooks, setHooks] = useState<GeneratedHook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [demoShown, setDemoShown] = useState(false);

  const generate = async () => {
    if (!topic.trim()) { setError('Enter a topic first'); return; }
    setError('');
    setLimitReached(false);

    // No-account demo: fire a curated set so visitors feel the product instantly.
    if (!isAuthenticated) {
      setLoading(true);
      setTimeout(() => {
        const shuffled = [...DEMO_HOOKS].sort(() => Math.random() - 0.5).slice(0, Math.min(count, 5));
        setHooks(shuffled);
        setDemoShown(true);
        setLoading(false);
      }, 600);
      return;
    }

    setLoading(true);
    try {
      const result = await api.hooks.generate({ topic, platform, tone, niche: niche || undefined, count, useAI });
      setHooks(result.hooks);
      if (result.hooks.length > 0) {
        toast({ title: `${result.hooks.length} hook${result.hooks.length > 1 ? 's' : ''} generated`, variant: 'success' });
      }
    } catch (err: unknown) {
      const e = err as { data?: { limitReached?: boolean }; message?: string };
      if (e?.data?.limitReached) setLimitReached(true);
      else setError(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gen">
      <div className="gen__field">
        <label className="gen__label" htmlFor="gen-topic">What&apos;s your hook about?</label>
        <Input
          id="gen-topic"
          inputSize="lg"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. building a side hustle, losing 20 pounds, learning to code..."
          onKeyDown={e => e.key === 'Enter' && generate()}
        />
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
          <label className="gen__label" htmlFor="gen-niche">Niche <span style={{ color: 'var(--text-subtle)' }}>(optional)</span></label>
          <Input id="gen-niche" value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. fitness, SaaS, cooking..." />
        </div>
      </div>

      <div className="gen__controls">
        <div className="gen__count">
          <span className="gen__label" style={{ margin: 0 }}>Hooks:</span>
          <PillSelect
            aria-label="Number of hooks"
            size="sm"
            value={String(count)}
            onChange={v => setCount(Number(v))}
            options={COUNT_OPTIONS(isPro)}
          />
        </div>
        {isPro && (
          <div className="gen__ai">
            <Switch checked={useAI} onChange={setUseAI} aria-label="AI-powered generation" />
            <span onClick={() => setUseAI(!useAI)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <Bolt size={14} /> AI-powered
            </span>
          </div>
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
            <span>Click to copy any hook</span>
          </div>
          <div className="gen__grid">
            {hooks.map((hook, i) => <HookCard key={hook.id ?? i} hook={hook} />)}
          </div>
          {!isAuthenticated && demoShown && (
            <div className="app__limit" style={{ marginTop: 16 }}>
              <p className="app__limit-t">Like these? Generate your own in seconds.</p>
              <p className="app__limit-s">Free forever · 10 hooks/day · no credit card</p>
              <a href="/register" className="hg-btn hg-btn--cta hg-btn--md" style={{ marginTop: 12, display: 'inline-flex' }}>
                <Bolt size={15} /> Start generating free
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
