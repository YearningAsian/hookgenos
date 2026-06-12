'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, History, Star, TrendingUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HookGenerator } from '@/components/HookGenerator';
import { TrendingHooks } from '@/components/TrendingHooks';
import { Badge } from '@/components/ui/badge';
import { fetchCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/api';

function DashboardTabs({ user }: { user: User | null }) {
  const [tab, setTab] = useState<'generate' | 'trending'>('generate');
  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 w-fit">
        {([
          { id: 'generate', label: '⚡ Generate', desc: 'AI + templates' },
          { id: 'trending', label: '🔥 Trending', desc: 'Viral right now' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-col rounded-lg px-5 py-2 text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {t.label}
            <span className="text-xs font-normal opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>
      {tab === 'generate' && (
        <HookGenerator isAuthenticated={true} isPro={user?.plan === 'PRO'} />
      )}
      {tab === 'trending' && (
        <TrendingHooks isAuthenticated={true} isPro={user?.plan === 'PRO'} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then(u => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Zap className="h-8 w-8 text-brand-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {user?.name ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Hook Generator'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">Generate hooks that stop the scroll</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user?.plan === 'PRO' ? 'pro' : 'secondary'}>
              {user?.plan === 'PRO' ? '✦ Pro' : 'Free'}
            </Badge>
            <a href="/dashboard/history" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              <History className="h-4 w-4" />History
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Generated', value: user?.hooksGenerated ?? 0, icon: Zap },
            { label: 'Plan', value: user?.plan ?? 'FREE', icon: Star },
            { label: 'Daily Limit', value: user?.plan === 'PRO' ? '∞' : '10/day', icon: TrendingUp },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">{s.label}</span>
                <s.icon className="h-3.5 w-3.5 text-zinc-600" />
              </div>
              <div className="text-xl font-bold text-zinc-100">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Free plan upgrade banner */}
        {user?.plan === 'FREE' && (
          <div className="mb-6 rounded-xl border border-brand-800/60 bg-brand-900/20 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-200">Upgrade to Pro for unlimited hooks + AI generation</p>
              <p className="text-xs text-zinc-500 mt-0.5">$9/month · Cancel anytime</p>
            </div>
            <a href="/pricing" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors whitespace-nowrap">
              Upgrade →
            </a>
          </div>
        )}

        {/* Mode tabs */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
          <DashboardTabs user={user} />
        </div>
      </main>
    </div>
  );
}
