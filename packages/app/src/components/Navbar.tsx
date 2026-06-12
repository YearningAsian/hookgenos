'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Menu, X, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { GithubIcon } from '@/components/ui/github-icon';
import { Button } from './ui/button';
import { fetchCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  const logout = async () => {
    try { await api.auth.logout(); } catch {}
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span>HookGenOS</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/#features" className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Features</Link>
          <Link href="/pricing" className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Pricing</Link>
          <a href={process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/YearningAsian/hookgenos'} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5">
            <GithubIcon className="h-4 w-4" />GitHub
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5" />Dashboard
                </Button>
              </Link>
              <Link href="/settings" className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors" title="Settings">
                <Settings className="h-4 w-4" />
              </Link>
              <button onClick={logout} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/register"><Button size="sm">Get Started</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-zinc-400" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-2">
          <Link href="/#features" className="block px-3 py-2 text-sm text-zinc-400">Features</Link>
          <Link href="/pricing" className="block px-3 py-2 text-sm text-zinc-400">Pricing</Link>
          <a href={process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/YearningAsian/hookgenos'} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-sm text-zinc-400">GitHub</a>
          {user ? (
            <>
              <Link href="/dashboard" className="block px-3 py-2 text-sm text-zinc-100">Dashboard</Link>
              <Link href="/settings" className="block px-3 py-2 text-sm text-zinc-400">Settings</Link>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Sign in</Button></Link>
              <Link href="/register" className="flex-1"><Button className="w-full">Get Started</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
