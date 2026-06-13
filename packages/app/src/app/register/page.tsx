'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bolt } from '@/components/ui/icons';
import { api } from '@/lib/api';
import { safeNextPath } from '@/lib/auth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.auth.register({ email, password, name: name || undefined });
      router.push(next);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__glow" />
      <div className="auth__inner">
        <div className="auth__head">
          <Link href="/" className="auth__brand">
            <span className="auth__brand-logo"><Bolt size={20} /></span>
            <span className="auth__brand-name">HookGenOS</span>
          </Link>
          <h1 className="auth__title">Create your account</h1>
          <p className="auth__sub">Free forever · No credit card required</p>
        </div>

        <div className="auth__card">
          <form onSubmit={submit}>
            {error && (
              <div className="app__notice app__notice--error" style={{ marginBottom: 16 }}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="auth__field">
              <label className="auth__label" htmlFor="register-name">Name <span className="text-zinc-600">(optional)</span></label>
              <Input id="register-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="auth__field">
              <label className="auth__label" htmlFor="register-email">Email</label>
              <Input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="auth__field">
              <label className="auth__label" htmlFor="register-password">Password</label>
              <Input id="register-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
            </div>
            <Button type="submit" variant="cta" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : 'Create free account'}
            </Button>
          </form>

          <div className="auth__perks">
            <div className="auth__perk"><Check className="h-3 w-3" />10 free hooks per day</div>
            <div className="auth__perk"><Check className="h-3 w-3" />6 platforms supported</div>
            <div className="auth__perk"><Check className="h-3 w-3" />No credit card needed</div>
          </div>
        </div>

        <p className="auth__foot">
          Already have an account?{' '}
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
