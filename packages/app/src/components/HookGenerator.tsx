'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { HookCard } from './HookCard';
import { cn } from '@/lib/utils';
import { api, type GeneratedHook } from '@/lib/api';
import { useToast } from './ui/toast';

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'general', label: 'General' },
];

const TONES = [
  { id: 'casual', label: 'Casual' },
  { id: 'bold', label: 'Bold' },
  { id: 'curious', label: 'Curious' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'professional', label: 'Professional' },
];

interface HookGeneratorProps {
  isPro?: boolean;
  isAuthenticated?: boolean;
}

export function HookGenerator({ isPro = false, isAuthenticated = false }: HookGeneratorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [tone, setTone] = useState('casual');
  const [niche, setNiche] = useState('');
  const [count, setCount] = useState(5);
  const [useAI, setUseAI] = useState(false);
  const [hooks, setHooks] = useState<GeneratedHook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  const generate = async () => {
    if (!topic.trim()) { setError('Enter a topic first'); return; }
    if (!isAuthenticated) {
      router.push('/register?next=/dashboard');
      return;
    }
    setLoading(true);
    setError('');
    setLimitReached(false);
    try {
      const result = await api.hooks.generate({ topic, platform, tone, niche: niche || undefined, count, useAI });
      setHooks(result.hooks);
      if (result.hooks.length > 0) {
        toast({ title: `${result.hooks.length} hook${result.hooks.length > 1 ? 's' : ''} generated`, variant: 'success' });
      }
    } catch (err: any) {
      if (err?.data?.limitReached) {
        setLimitReached(true);
      } else {
        setError(err.message || 'Generation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topic input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">What's your hook about?</label>
        <div className="flex gap-3">
          <Input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. building a side hustle, losing 20 pounds, learning to code..."
            className="flex-1 h-12 text-base"
            onKeyDown={e => e.key === 'Enter' && generate()}
          />
        </div>
      </div>

      {/* Platform selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                platform === p.id
                  ? 'border-brand-500 bg-brand-900/50 text-brand-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone + Niche row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  tone === t.id
                    ? 'border-brand-500 bg-brand-900/50 text-brand-300'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Niche <span className="text-zinc-600">(optional)</span></label>
          <Input
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="e.g. fitness, SaaS, cooking..."
          />
        </div>
      </div>

      {/* Count + AI row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-300">Hooks:</label>
          {[3, 5, 7, 10].map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              disabled={!isPro && n > 5}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                count === n
                  ? 'border-brand-500 bg-brand-900/50 text-brand-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300',
                !isPro && n > 5 && 'opacity-40 cursor-not-allowed'
              )}
            >
              {n}
              {!isPro && n > 5 && <span className="ml-1 text-xs text-brand-400">Pro</span>}
            </button>
          ))}
        </div>

        {isPro && (
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setUseAI(!useAI)}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                useAI ? 'bg-brand-600' : 'bg-zinc-700'
              )}
            >
              <div className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                useAI ? 'translate-x-4' : 'translate-x-0.5'
              )} />
            </div>
            <span className="text-sm text-zinc-300 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              AI-powered
            </span>
          </label>
        )}

        <Button
          onClick={generate}
          disabled={loading || !topic.trim()}
          size="lg"
          className="ml-auto bg-brand-600 hover:bg-brand-700 gap-2 min-w-[140px]"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
          ) : (
            <><Zap className="h-4 w-4" />Generate</>
          )}
        </Button>
      </div>

      {/* Error states */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {limitReached && (
        <div className="rounded-xl border border-brand-700 bg-brand-900/30 p-5 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-brand-400" />
          <p className="font-semibold text-zinc-100">Daily limit reached</p>
          <p className="mt-1 text-sm text-zinc-400">Free plan: 10 hooks/day. Upgrade to Pro for unlimited.</p>
          <a href="/pricing" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
            Upgrade to Pro
          </a>
        </div>
      )}

      {/* Results */}
      {hooks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">{hooks.length} hooks generated</h3>
            <span className="text-xs text-zinc-500">Click to copy any hook</span>
          </div>
          <div className="grid gap-3">
            {hooks.map((hook, i) => (
              <HookCard key={i} hook={hook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
