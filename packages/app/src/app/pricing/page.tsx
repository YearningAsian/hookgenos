'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startCheckout = async () => {
    setError('');
    setLoading(true);
    try {
      const { url } = await api.billing.createCheckout();
      window.location.href = url!;
    } catch (err: any) {
      if (err.status === 401) {
        window.location.href = '/register?next=/pricing';
        return;
      }
      setError(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-zinc-100">Simple pricing</h1>
          <p className="mt-3 text-zinc-500">Start free. Upgrade when you need more.</p>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-2xl flex items-center gap-3 rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
            <div className="mb-6">
              <div className="text-sm font-medium text-zinc-400">Free</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-100">$0</span>
                <span className="text-zinc-500 text-sm">forever</span>
              </div>
            </div>
            {['10 hooks per day', '6 platforms', '60+ templates', 'History (30 days)', 'Self-host'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-300 mb-2.5">
                <Check className="h-4 w-4 text-zinc-600 shrink-0" />{f}
              </div>
            ))}
            <Link href="/register"><Button variant="outline" className="w-full mt-4">Get started free</Button></Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-brand-600 bg-brand-900/20 p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">Most Popular</div>
            <div className="mb-6">
              <div className="text-sm font-medium text-brand-300">Pro</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-100">$9</span>
                <span className="text-zinc-500 text-sm">/month</span>
              </div>
            </div>
            {['Unlimited hooks', 'All platforms', 'AI-powered generation', 'Unlimited history', 'Priority support', 'Early access'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-300 mb-2.5">
                <Check className="h-4 w-4 text-brand-400 shrink-0" />{f}
              </div>
            ))}
            <Button onClick={startCheckout} disabled={loading} className="w-full mt-4 bg-brand-600 hover:bg-brand-700 gap-2">
              <Zap className="h-4 w-4" />{loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-600">
          Self-hosting? The full app is free to run on your own infrastructure.{' '}
          <a href={process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/YearningAsian/hookgenos'} className="text-zinc-500 hover:text-zinc-300 underline">See setup guide →</a>
        </p>
      </main>
    </div>
  );
}
