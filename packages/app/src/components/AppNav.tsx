'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Settings, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { Bolt } from '@/components/ui/icons';
import { fetchCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/history', label: 'History', icon: History },
];

/** AppNav — the authenticated glass nav: a blurred, hairline-bordered bar. */
export function AppNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { fetchCurrentUser().then(setUser); }, []);

  const logout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        <Link className="app-nav__brand" href="/dashboard">
          <span className="app-nav__logo"><Bolt size={15} /></span>
          <span>HookGenOS</span>
        </Link>

        <div className="app-nav__links">
          {LINKS.map(l => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={`app-nav__link ${active ? 'is-active' : ''}`}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            );
          })}
        </div>

        <div className="app-nav__right">
          <Link href="/settings" className="app-nav__icon" title="Settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
          <button onClick={logout} className="app-nav__icon" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
          <button className="app-nav__icon md:hidden" aria-label="Menu" onClick={() => setOpen(o => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-800 px-5 py-3 flex flex-col gap-1">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className="app-nav__link" onClick={() => setOpen(false)}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
          <Link href="/settings" className="app-nav__link" onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4" />Settings
          </Link>
        </div>
      )}
    </nav>
  );
}
