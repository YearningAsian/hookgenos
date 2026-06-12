'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Zap, AlertTriangle, ExternalLink, Save } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Zap className="h-8 w-8 text-brand-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your account preferences</p>
        </div>

        {/* Profile section */}
        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <User className="h-4 w-4" />
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name-input" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Display name
              </label>
              <div className="flex gap-2">
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
                  size="sm"
                  className="gap-1.5 shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  Email
                </span>
              </label>
              <Input
                value={userData?.email ?? ''}
                readOnly
                disabled
                className="cursor-default text-zinc-400"
              />
              <p className="mt-1 text-xs text-zinc-600">Email cannot be changed.</p>
            </div>
          </div>
        </section>

        {/* Plan & stats section */}
        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Zap className="h-4 w-4" />
            Plan & Usage
          </h2>
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">Current plan</span>
                <Badge variant={userData?.plan === 'PRO' ? 'pro' : 'secondary'}>
                  {userData?.plan === 'PRO' ? '✦ Pro' : 'Free'}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">Hooks generated</span>
                <span className="text-sm font-semibold text-zinc-100">
                  {userData?.hooksGenerated ?? 0}
                </span>
              </div>
            </div>
          </div>

          {userData?.plan === 'FREE' && (
            <div className="mt-5 rounded-xl border border-brand-800/50 bg-brand-900/20 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-200">Upgrade to Pro</p>
                <p className="text-xs text-zinc-500 mt-0.5">Unlimited hooks · AI generation · $9/month</p>
              </div>
              <Link href="/pricing">
                <Button size="sm" className="gap-1.5 shrink-0">
                  Upgrade <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-900/50 bg-zinc-900/40 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Delete account</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Permanently remove your account and all generated hooks. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="shrink-0 border-red-800/60 text-red-400 hover:bg-red-900/30 hover:text-red-300"
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
