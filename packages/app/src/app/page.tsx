import Link from 'next/link';
import { Zap, Github, ArrowRight, Check, Star, TrendingUp, Clock, Users, Sparkles, Code2, Shield } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { HookGenerator } from '@/components/HookGenerator';

const FEATURES = [
  { icon: TrendingUp, title: 'Daily Trending Hooks', desc: 'Hooks extracted from viral YouTube & Reddit content, scored by AI. Updated every 24 hours.' },
  { icon: Zap, title: '60+ Proven Templates', desc: 'Curiosity gaps, FOMO, contrarian, pain points, story arcs — every formula that stops the scroll.' },
  { icon: Sparkles, title: 'AI-Powered Generation', desc: 'GPT-4o-mini integration for truly unique hooks tailored to your exact topic and tone.' },
  { icon: Clock, title: 'Hook History', desc: 'Every hook you\'ve ever generated, searchable and filterable. Never lose a great idea.' },
  { icon: Code2, title: 'Self-Hostable', desc: 'Run it on your own server. Docker Compose up and you\'re live. Full control over your data.' },
  { icon: Shield, title: 'Open Source Core', desc: 'MIT licensed. Inspect the formulas, contribute improvements, build on top of it.' },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for getting started',
    features: ['10 hooks per day', '6 platforms', '60+ templates', 'Hook history (30 days)', 'Copy to clipboard', 'Self-host friendly'],
    cta: 'Get Started',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For serious creators & marketers',
    features: ['Unlimited hooks', 'All platforms', 'AI-powered generation', 'Unlimited history', 'Priority support', 'Early access to features'],
    cta: 'Start Pro',
    href: '/register?plan=pro',
    highlight: true,
  },
];

const HOOK_EXAMPLES = [
  { text: 'Stop scrolling — this is the advice I wish I had at 22', type: 'FOMO', platform: 'TikTok', score: 94 },
  { text: 'Unpopular opinion: working harder is actually making you worse at your job', type: 'Contrarian', platform: 'LinkedIn', score: 91 },
  { text: 'The one thing nobody tells you about building an audience', type: 'Curiosity', platform: 'Instagram', score: 88 },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-800/60 bg-brand-900/30 px-4 py-1.5 text-sm text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            Open source · MIT License
            <a href="https://github.com/your-org/hookgenos" className="ml-1 flex items-center gap-1 text-brand-400 hover:text-brand-300">
              <Github className="h-3.5 w-3.5" />Star on GitHub
            </a>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Generate hooks that{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              stop the scroll
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            60+ psychological hook formulas for TikTok, Instagram, YouTube, LinkedIn and more.
            Open source, self-hostable, and optionally AI-powered.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-brand-600 hover:bg-brand-700 h-12 px-7 text-base">
                Start generating free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com/your-org/hookgenos" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2 h-12 px-7 text-base">
                <Github className="h-4 w-4" />View on GitHub
              </Button>
            </a>
          </div>

          <p className="mt-4 text-sm text-zinc-600">No credit card required · 10 free hooks/day</p>
        </div>
      </section>

      {/* Live Demo */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-center">
            <span className="text-sm text-zinc-500">Try it now — no account needed</span>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
            <HookGenerator isAuthenticated={false} isPro={false} />
          </div>
        </div>
      </section>

      {/* Example hooks */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-zinc-100">What great hooks look like</h2>
            <p className="mt-2 text-zinc-500">Hooks backed by research into what actually performs</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOOK_EXAMPLES.map((h, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="mb-4 text-base font-medium text-zinc-100 leading-relaxed">"{h.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="rounded-full border border-brand-800 bg-brand-900/50 px-2.5 py-0.5 text-xs text-brand-300">{h.type}</span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">{h.platform}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Zap className="h-3 w-3" />{h.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-zinc-100">Everything you need to hook your audience</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900/50 border border-brand-800">
                  <f.icon className="h-5 w-5 text-brand-400" />
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-zinc-100">Simple, transparent pricing</h2>
            <p className="mt-2 text-zinc-500">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {PRICING.map((p) => (
              <div key={p.name} className={`rounded-2xl border p-8 ${p.highlight ? 'border-brand-600 bg-brand-900/20 relative' : 'border-zinc-800 bg-zinc-900/50'}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-medium text-zinc-400">{p.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-zinc-100">{p.price}</span>
                    <span className="text-zinc-500 text-sm">{p.period}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{p.desc}</p>
                </div>
                <ul className="mb-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href}>
                  <Button className={`w-full ${p.highlight ? 'bg-brand-600 hover:bg-brand-700' : ''}`} variant={p.highlight ? 'default' : 'outline'}>
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Self-hosting? Run it for free on your own infrastructure.{' '}
            <a href="https://github.com/your-org/hookgenos" className="text-zinc-500 hover:text-zinc-300 underline">See the docs →</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">HookGenOS</span>
            <span className="text-zinc-600 text-sm">· MIT License</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="https://github.com/your-org/hookgenos" className="hover:text-zinc-300 flex items-center gap-1.5"><Github className="h-4 w-4" />GitHub</a>
            <Link href="/pricing" className="hover:text-zinc-300">Pricing</Link>
            <Link href="/login" className="hover:text-zinc-300">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
