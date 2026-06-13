'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { History, Star, TrendingUp } from 'lucide-react';
import { AppNav } from '@/components/AppNav';
import { HookGenerator } from '@/components/HookGenerator';
import { TrendingHooks } from '@/components/TrendingHooks';
import { Badge } from '@/components/ui/badge';
import { Bolt } from '@/components/ui/icons';
import { fetchCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/api';

function DashboardTabs({ user }: { user: User | null }) {
  const [tab, setTab] = useState<'generate' | 'trending'>('generate');
  const isPro = user?.plan === 'PRO';
  return (
    <div>
      <div className="app__tabs">
        {([
          { id: 'generate', label: '⚡ Generate', desc: 'AI + templates' },
          { id: 'trending', label: '🔥 Trending', desc: 'Viral right now' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`app__tab ${tab === t.id ? 'is-active' : ''}`}>
            <span>{t.label}</span><em>{t.desc}</em>
          </button>
        ))}
      </div>
      {tab === 'generate'
        ? <HookGenerator isAuthenticated isPro={isPro} />
        : <TrendingHooks isAuthenticated isPro={isPro} />}
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
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-brand-500" style={{ animation: 'hg-pulse 1.4s var(--ease-in-out) infinite' }}><Bolt size={32} /></span>
      </div>
    );
  }

  const isPro = user?.plan === 'PRO';
  const stats = [
    { label: 'Total generated', value: String(user?.hooksGenerated ?? 0), icon: Bolt },
    { label: 'Plan', value: user?.plan ?? 'FREE', icon: Star },
    { label: 'Daily limit', value: isPro ? '∞' : '10/day', icon: TrendingUp },
  ];

  return (
    <div>
      <AppNav />
      <main className="app__main">
        <div className="app__head">
          <div>
            <h1 className="app__title">{user?.name ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Hook generator'}</h1>
            <p className="app__subtitle">Generate hooks that stop the scroll</p>
          </div>
          <div className="app__head-right">
            <Badge variant={isPro ? 'pro' : 'secondary'}>{isPro ? '✦ Pro' : 'Free'}</Badge>
            <Link href="/dashboard/history" className="app__history"><History className="h-4 w-4" /> History</Link>
          </div>
        </div>

        <div className="app__stats">
          {stats.map(s => (
            <div key={s.label} className="stat">
              <div className="stat__l">{s.label}<s.icon className="h-[13px] w-[13px]" /></div>
              <div className="stat__v">{s.value}</div>
            </div>
          ))}
        </div>

        {!isPro && (
          <div className="app__upsell">
            <div>
              <p className="app__upsell-t">Upgrade to Pro for unlimited hooks + AI generation</p>
              <p className="app__upsell-s">$9/month · Cancel anytime</p>
            </div>
            <Link href="/pricing" className="hg-btn hg-btn--cta hg-btn--sm">Upgrade →</Link>
          </div>
        )}

        <div className="app__panel">
          <DashboardTabs user={user} />
        </div>
      </main>
    </div>
  );
}
