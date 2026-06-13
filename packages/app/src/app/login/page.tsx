'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bolt } from '@/components/ui/icons';
import { api } from '@/lib/api';
import { safeNextPath } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.login({ email, password });
      router.push(next);
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
          <h1 className="auth__title">Welcome back</h1>
          <p className="auth__sub">Sign in to your account</p>
        </div>

        <div className="auth__card">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="app__notice app__notice--error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="auth__field">
              <label className="auth__label">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="auth__field">
              <label className="auth__label">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" variant="cta" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="auth__foot">
          No account?{' '}
          <Link href={`/register?next=${encodeURIComponent(next)}`}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
