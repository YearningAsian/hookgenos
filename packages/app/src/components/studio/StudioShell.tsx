'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
import { useStudio } from './StudioProvider';
import { useFocusTrap } from './useFocusTrap';
import { api } from '@/lib/api';
import { CREATORS } from '@/lib/studio/data';

interface NavDef {
  id: string;
  label: string;
  icon: string;
  sub: string;
  href: string;
  badge?: number;
}

const SPYDER_BADGE = CREATORS.filter((c) => c.tracked).reduce((s, c) => s + c.newCount, 0);

const NAV: NavDef[] = [
  { id: 'discover', label: 'Discover', icon: 'compass', sub: 'Swipe library', href: '/dashboard' },
  { id: 'generate', label: 'Generate', icon: 'bolt', sub: 'AI + formulas', href: '/dashboard/generate' },
  { id: 'spyder', label: 'Spyder', icon: 'radar', sub: 'Track creators', href: '/dashboard/spyder', badge: SPYDER_BADGE },
  { id: 'boards', label: 'Boards', icon: 'layers', sub: 'Swipe file', href: '/dashboard/boards' },
  { id: 'ripper', label: 'Ripper', icon: 'link', sub: 'Paste a URL', href: '/dashboard/ripper' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link className="sh-brand" href="/dashboard">
      <span className="sh-brand__logo"><Icon name="bolt" size={17} fill="currentColor" /></span>
      <span className="sh-brand__name">HookGen<span className="sh-brand__os">Studio</span></span>
    </Link>
  );
}

function PlanCard() {
  const { isPro } = useStudio();
  if (isPro) {
    return (
      <div className="sh-plan sh-plan--pro">
        <div className="sh-plan__row"><span>✦</span> Pro · Unlimited</div>
        <p className="sh-plan__note" style={{ margin: 0 }}>AI generation + all formulas unlocked.</p>
      </div>
    );
  }
  return (
    <div className="sh-plan">
      <p className="sh-plan__note">Free plan · 10 hooks/day</p>
      <Link className="sh-plan__up" href="/pricing">Upgrade to Pro · $9/mo <Icon name="arrowRight" size={14} /></Link>
    </div>
  );
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openCommand } = useStudio();
  const [navOpen, setNavOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // On mobile the sidebar is a modal drawer: trap focus while open and restore
  // it to the trigger on close (no-op on desktop where navOpen stays false).
  useFocusTrap(sidebarRef, navOpen);

  useEffect(() => {
    if (!navOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [navOpen]);

  const logout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    window.location.href = '/';
  };

  const navItems = (
    <nav className="sh-nav">
      {NAV.map((n) => (
        <Link
          key={n.id}
          href={n.href}
          className={`sh-nav__item ${isActive(pathname, n.href) ? 'is-on' : ''}`}
          onClick={() => setNavOpen(false)}
          aria-current={isActive(pathname, n.href) ? 'page' : undefined}
        >
          <span className="sh-nav__icon">
            <Icon name={n.icon} size={18} />
            {n.badge ? <span className="sh-nav__badge">{n.badge}</span> : null}
          </span>
          <span className="sh-nav__txt">
            <span className="sh-nav__lbl">{n.label}</span>
            <span className="sh-nav__sub">{n.sub}</span>
          </span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="sh">
      <span className="sh-glow" aria-hidden="true" />

      {/* Mobile top bar */}
      <header className="sh-mobilebar">
        <button className="sh-mobilebar__menu" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)} type="button">
          <Icon name="menu" size={18} />
        </button>
        <Brand />
        <button className="sh-cmd sh-cmd--sm" onClick={openCommand} style={{ marginLeft: 'auto', width: 'auto' }} type="button">
          <Icon name="search" size={15} /> <kbd>⌘K</kbd>
        </button>
      </header>

      {navOpen && <div className="sh-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <aside className={`sh-sidebar ${navOpen ? 'is-open' : ''}`} ref={sidebarRef} aria-label="Studio navigation">
        <div className="sh-sidebar__top"><Brand /></div>
        <button className="sh-cmd" onClick={openCommand} type="button">
          <Icon name="search" size={15} /> Quick find <kbd>⌘K</kbd>
        </button>
        {navItems}
        <div className="sh-sidebar__foot">
          <PlanCard />
          <div className="sh-sidebar__util">
            <Link href="/settings" className="sh-utilbtn"><Icon name="settings" size={15} /> Settings</Link>
            <button className="sh-utilbtn" onClick={logout} type="button"><Icon name="logout" size={15} /> Sign out</button>
          </div>
        </div>
      </aside>

      <div className="sh-main" aria-hidden={navOpen || undefined}>
        <main className="sh-canvas">{children}</main>
      </div>
    </div>
  );
}
