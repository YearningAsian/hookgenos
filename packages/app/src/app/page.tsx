import Link from 'next/link';
import { TrendingUp, Sparkles, Clock, Code2, Shield, Check } from 'lucide-react';
import { GithubIcon } from '@/components/ui/github-icon';
import { Bolt } from '@/components/ui/icons';
import { SiteNav } from '@/components/SiteNav';
import { TypingHeadline } from '@/components/TypingHeadline';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { HookGenerator } from '@/components/HookGenerator';

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/YearningAsian/hookgenos';

const FEATURES = [
  { icon: TrendingUp, title: 'Daily trending hooks', desc: 'Hooks extracted from viral YouTube & Reddit content, scored by AI. Updated every 24 hours.' },
  { icon: Bolt, title: '60+ proven templates', desc: 'Curiosity gaps, FOMO, contrarian, pain points, story arcs — every formula that stops the scroll.' },
  { icon: Sparkles, title: 'AI-powered generation', desc: 'GPT-4o-mini integration for truly unique hooks tailored to your exact topic and tone.' },
  { icon: Clock, title: 'Hook history', desc: "Every hook you've ever generated, searchable and filterable. Never lose a great idea." },
  { icon: Code2, title: 'Self-hostable', desc: "Run it on your own server. Docker Compose up and you're live. Full control over your data." },
  { icon: Shield, title: 'Open source core', desc: 'MIT licensed. Inspect the formulas, contribute improvements, build on top of it.' },
];

const PRICING = [
  {
    name: 'Free', price: '$0', period: 'forever', highlight: false, cta: 'Get started free', href: '/register',
    variant: 'outline' as const,
    features: ['10 hooks per day', '6 platforms', '60+ templates', 'History (30 days)', 'Self-host friendly'],
  },
  {
    name: 'Pro', price: '$9', period: '/month', highlight: true, cta: 'Start Pro', href: '/register?plan=pro',
    variant: 'cta' as const,
    features: ['Unlimited hooks', 'All platforms', 'AI-powered generation', 'Unlimited history', 'Priority support', 'Early access'],
  },
];

export default function HomePage() {
  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="hero" id="top">
        <div className="hero__glow" />
        <div className="hero__inner">
          <div className="hero__badge">
            <span className="hero__dot" />
            Open source · MIT License
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hero__star">
              <GithubIcon className="h-[13px] w-[13px]" /> Star on GitHub
            </a>
          </div>
          <h1 className="hero__title">
            Generate hooks that<br /><TypingHeadline />
          </h1>
          <p className="hero__sub">
            60+ psychological hook formulas for TikTok, Instagram, YouTube, LinkedIn and more.
            Open source, self-hostable, and optionally AI-powered.
          </p>
          <div className="hero__cta">
            <Link href="/register"><Button variant="cta" size="lg" className="hg-btn--breathe"><Bolt size={16} /> Start generating free</Button></Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg"><GithubIcon className="h-4 w-4" /> View on GitHub</Button>
            </a>
          </div>
          <p className="hero__fine">No credit card required · 10 free hooks/day</p>
        </div>
      </section>

      {/* Live demo */}
      <section className="demo" id="how">
        <p className="demo__eyebrow">Try it now — no account needed</p>
        <div className="demo__panel">
          <HookGenerator isAuthenticated={false} isPro={false} />
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="sec-head">
          <span className="sec-eyebrow">Built to convert</span>
          <h2 className="sec-title">Everything you need to hook your audience</h2>
        </div>
        <div className="features__grid">
          {FEATURES.map(f => (
            <Card key={f.title} hover pad>
              <div className="features__icon"><f.icon className="h-[18px] w-[18px]" /></div>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="sec-head">
          <span className="sec-eyebrow">Pricing</span>
          <h2 className="sec-title">Simple, transparent pricing</h2>
          <p className="sec-sub">Start free. Upgrade when you need more.</p>
        </div>
        <div className="pricing__grid">
          {PRICING.map(p => (
            <div key={p.name} className={`price-card ${p.highlight ? 'is-pro' : ''}`}>
              {p.highlight && <span className="price-card__ribbon">Most Popular</span>}
              <div className="price-card__name">{p.name}</div>
              <div className="price-card__amount"><span>{p.price}</span><em>{p.period}</em></div>
              <ul className="price-card__list">
                {p.features.map(f => (
                  <li key={f}><i className={p.highlight ? 'on' : ''}><Check className="h-4 w-4" /></i>{f}</li>
                ))}
              </ul>
              <Link href={p.href} className="block"><Button variant={p.variant} className="w-full">{p.cta}</Button></Link>
            </div>
          ))}
        </div>
        <p className="pricing__note">
          Self-hosting? Run it for free on your own infrastructure.{' '}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">See the docs →</a>
        </p>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-footer__brand">
          <span className="site-nav__logo" style={{ width: 24, height: 24 }}><Bolt size={13} /></span>
          HookGenOS <span className="site-footer__dim">· MIT License</span>
        </div>
        <div className="site-footer__links">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"><GithubIcon className="h-4 w-4" /> GitHub</a>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Sign in</Link>
        </div>
      </footer>
    </>
  );
}
