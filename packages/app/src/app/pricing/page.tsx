'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, AlertCircle } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Button } from '@/components/ui/button';
import { Bolt } from '@/components/ui/icons';
import { api } from '@/lib/api';

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/YearningAsian/hookgenos';

const FREE_FEATURES = ['10 hooks per day', '6 platforms', '60+ templates', 'History (30 days)', 'Self-host friendly'];
const PRO_FEATURES = ['Unlimited hooks', 'All platforms', 'AI-powered generation', 'Unlimited history', 'Priority support', 'Early access'];

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
    <>
      <SiteNav />

      <section className="pricing" style={{ paddingTop: 56 }}>
        <div className="sec-head">
          <span className="sec-eyebrow">Pricing</span>
          <h2 className="sec-title">Simple, transparent pricing</h2>
          <p className="sec-sub">Start free. Upgrade when you need more.</p>
        </div>

        {error && (
          <div className="app__notice app__notice--error" style={{ maxWidth: 740, margin: '0 auto 1.25rem' }}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="pricing__grid">
          {/* Free */}
          <div className="price-card">
            <div className="price-card__name">Free</div>
            <div className="price-card__amount"><span>$0</span><em>forever</em></div>
            <ul className="price-card__list">
              {FREE_FEATURES.map(f => (
                <li key={f}><i><Check className="h-4 w-4" /></i>{f}</li>
              ))}
            </ul>
            <Link href="/register" className="block"><Button variant="outline" className="w-full">Get started free</Button></Link>
          </div>

          {/* Pro */}
          <div className="price-card is-pro">
            <span className="price-card__ribbon">Most Popular</span>
            <div className="price-card__name">Pro</div>
            <div className="price-card__amount"><span>$9</span><em>/month</em></div>
            <ul className="price-card__list">
              {PRO_FEATURES.map(f => (
                <li key={f}><i className="on"><Check className="h-4 w-4" /></i>{f}</li>
              ))}
            </ul>
            <Button variant="cta" className="w-full" onClick={startCheckout} disabled={loading}>
              <Bolt size={15} /> {loading ? 'Redirecting…' : 'Upgrade to Pro'}
            </Button>
          </div>
        </div>

        <p className="pricing__note">
          Self-hosting? Run it for free on your own infrastructure.{' '}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">See the docs →</a>
        </p>
      </section>
    </>
  );
}
