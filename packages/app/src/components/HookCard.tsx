'use client';
import { useState } from 'react';
import { Copy, Heart, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useToast } from './ui/toast';
import type { GeneratedHook } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  curiosity: 'Curiosity',
  fear_fomo: 'FOMO',
  contrarian: 'Contrarian',
  pain_point: 'Pain Point',
  how_to: 'How-To',
  list: 'List',
  story: 'Story',
  question: 'Question',
  shocking_stat: 'Stat',
  challenge: 'Challenge',
  personal: 'Personal',
  social_proof: 'Social Proof',
};

const TYPE_COLORS: Record<string, string> = {
  curiosity: 'bg-blue-900/50 text-blue-300 border-blue-800',
  fear_fomo: 'bg-red-900/50 text-red-300 border-red-800',
  contrarian: 'bg-orange-900/50 text-orange-300 border-orange-800',
  pain_point: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  how_to: 'bg-green-900/50 text-green-300 border-green-800',
  list: 'bg-cyan-900/50 text-cyan-300 border-cyan-800',
  story: 'bg-purple-900/50 text-purple-300 border-purple-800',
  shocking_stat: 'bg-pink-900/50 text-pink-300 border-pink-800',
  question: 'bg-indigo-900/50 text-indigo-300 border-indigo-800',
};

interface HookCardProps {
  hook: GeneratedHook;
  onFavorite?: (id: string) => void;
}

export function HookCard({ hook, onFavorite }: HookCardProps) {
  const [copied, setCopied] = useState(false);
  const [faved, setFaved] = useState(hook.isFavorite ?? false);
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(hook.text);
    setCopied(true);
    toast({ title: 'Copied to clipboard', variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFav = () => {
    setFaved(!faved);
    if (hook.id) onFavorite?.(hook.id);
  };

  const scoreColor = hook.score >= 88 ? 'bg-emerald-500' : hook.score >= 75 ? 'bg-yellow-500' : 'bg-zinc-600';

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-200">
      {/* Score indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5">
          <Zap className="h-3 w-3 text-yellow-400" />
          <span className="text-xs font-medium text-zinc-300">{hook.score}</span>
        </div>
      </div>

      {/* Hook text */}
      <p className="mb-4 pr-16 text-base leading-relaxed text-zinc-100 font-medium">
        {hook.text}
      </p>

      {/* Score bar */}
      <div className="mb-4 h-1 w-full rounded-full bg-zinc-800">
        <div
          className={cn('h-1 rounded-full transition-all', scoreColor)}
          style={{ width: `${hook.score}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
            TYPE_COLORS[hook.type] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
          )}>
            {TYPE_LABELS[hook.type] || hook.type}
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
            {hook.platform}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleFav}
            className={cn(
              'rounded-lg p-2 transition-colors',
              faved ? 'text-pink-400 hover:text-pink-300' : 'text-zinc-600 hover:text-zinc-400'
            )}
          >
            <Heart className="h-4 w-4" fill={faved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {hook.explanation && (
        <p className="mt-3 text-xs text-zinc-500 italic border-t border-zinc-800 pt-3">
          {hook.explanation}
        </p>
      )}
    </div>
  );
}
