'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, AlertTriangle, Save } from 'lucide-react';
import { AppNav } from '@/components/AppNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bolt } from '@/components/ui/icons';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';
import type { User as UserType } from '@/lib/api';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetchCurrentUser().then(u => {
      if (!u) { router.push('/login'); return; }
      // Fetch full user data (includes hooksGenerated)
      api.user.me().then(full => {
        setUserData(full);
        setName(full.name ?? '');
        setLoading(false);
      }).catch(() => {
        // Fallback to auth.me data
        setUserData(u);
        setName(u.name ?? '');
        setLoading(false);
      });
    });
  }, [router]);

  const handleSaveName = async () => {
    if (!userData) return;
    setSaving(true);
    try {
      const updated = await api.user.update({ name: name.trim() || undefined });
      setUserData(prev => prev ? { ...prev, name: updated.name } : prev);
      toast({ title: 'Name saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save name', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.user.delete();
      await api.auth.logout().catch(() => {});
      toast({ title: 'Account deleted', description: 'Your account has been removed.', variant: 'default' });
      router.push('/');
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 404 || status === 501) {
        toast({
          title: 'Contact support to delete your account',
          description: 'Please email us at support@hookgenos.com',
          variant: 'default',
        });
      } else {
        toast({ title: 'Failed to delete account', variant: 'error' });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-brand-500" style={{ animation: 'hg-pulse 1.4s var(--ease-in-out) infinite' }}><Bolt size={32} /></span>
      </div>
    );
  }

  const isPro = userData?.plan === 'PRO';

  return (
    <div>
      <AppNav />
      <main className="page">
        <div className="page__head">
          <h1 className="page__title">Settings</h1>
          <p className="page__sub">Manage your account preferences</p>
        </div>

        {/* Profile section */}
        <section className="section">
          <h2 className="section__h">
            <UserIcon className="h-4 w-4" />
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name-input" className="auth__label">Display name</label>
              <div className="field-row">
                <Input
                  id="name-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1"
                  maxLength={100}
                />
                <Button
                  onClick={handleSaveName}
                  disabled={saving || name.trim() === (userData?.name ?? '')}
                  variant="default"
                  size="sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div>
              <label className="auth__label" htmlFor="settings-email">Email</label>
              <Input
                id="settings-email"
                value={userData?.email ?? ''}
                readOnly
                disabled
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="mt-1 text-xs text-zinc-500">Email cannot be changed.</p>
            </div>
          </div>
        </section>

        {/* Plan & usage section */}
        <section className="section">
          <h2 className="section__h">
            <Bolt size={16} />
            Plan &amp; usage
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Current plan</span>
              <Badge variant={isPro ? 'pro' : 'secondary'}>{isPro ? '✦ Pro' : 'Free'}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Hooks generated</span>
              <span className="text-sm font-semibold text-zinc-100">{userData?.hooksGenerated ?? 0}</span>
            </div>
          </div>

          {userData?.plan === 'FREE' && (
            <div className="app__upsell mt-5">
              <div>
                <p className="app__upsell-t">Upgrade to Pro for unlimited hooks + AI generation</p>
                <p className="app__upsell-s">$9/month · Cancel anytime</p>
              </div>
              <Link href="/pricing">
                <Button size="sm">Upgrade →</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="section section--danger">
          <h2 className="section__h">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Delete account</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Permanently remove your account and all generated hooks. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
