'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { GithubIcon } from '@/components/ui/github-icon';
import { Bolt } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { fetchCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/api';

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/YearningAsian/hookgenos';

const SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
];

/**
 * SiteNav — the marketing nav as a live object: a floating pill that
 * compresses and gains a glassy weight on scroll, with a sliding active-section
 * indicator on the home page and an animated full-screen overlay on mobile.
 */
export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('features');
  const [menuOpen, setMenuOpen] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0 });

  useEffect(() => { fetchCurrentUser().then(setUser); }, []);

  // Overlay: close on Escape, move focus into the dialog, return it to the burger on close.
  useEffect(() => {
    if (!menuOpen) return;
    const burger = burgerRef.current;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
      burger?.focus();
    };
  }, [menuOpen]);

  // On inner pages the nav is always in its glass state; on home it reacts to scroll.
  const navScrolled = isHome ? scrolled : true;
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, [isHome]);

  // Scroll-spy across the home sections.
  useEffect(() => {
    if (!isHome) return;
    const els = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [isHome]);

  // Slide the indicator under the active link.
  const measure = useCallback(() => {
    const el = linksRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);
  useEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const href = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  return (
    <nav className={`site-nav ${navScrolled ? 'is-scrolled' : ''}`}>
      <div className="site-nav__inner">
        <Link className="site-nav__brand" href="/">
          <span className="site-nav__logo"><Bolt size={16} /></span>
          <span>HookGenOS</span>
        </Link>

        <div className="site-nav__links" ref={linksRef}>
          <span className="site-nav__ind" style={{ left: ind.left, width: ind.width }} />
          {SECTIONS.map(s => (
            <Link
              key={s.id}
              data-id={s.id}
              href={href(s.id)}
              className={`site-nav__link ${isHome && active === s.id ? 'is-active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </Link>
          ))}
          <a className="site-nav__link" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <GithubIcon className="h-[15px] w-[15px]" /> GitHub
          </a>
        </div>

        <div className="site-nav__cta">
          {user ? (
            <Link href="/dashboard"><Button variant="cta" size="sm"><Bolt size={14} /> Open Studio</Button></Link>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/register"><Button variant="cta" size="sm"><Bolt size={14} /> Generate free</Button></Link>
            </>
          )}
        </div>

        <button ref={burgerRef} className="site-nav__burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {menuOpen && (
        <div className="site-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="site-menu__top">
            <Link className="site-nav__brand" href="/" onClick={() => setMenuOpen(false)}>
              <span className="site-nav__logo"><Bolt size={16} /></span>
              <span>HookGenOS</span>
            </Link>
            <button ref={closeBtnRef} className="app-nav__icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {SECTIONS.map((s, i) => (
            <Link key={s.id} href={href(s.id)} className="site-menu__link" style={{ animationDelay: `${i * 60}ms` }} onClick={() => setMenuOpen(false)}>
              {s.label}
            </Link>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="site-menu__link" style={{ animationDelay: `${SECTIONS.length * 60}ms` }}>
            GitHub
          </a>
          <div className="site-menu__actions">
            {user ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}><Button variant="cta" className="w-full"><Bolt size={15} /> Open Studio</Button></Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Sign in</Button></Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}><Button variant="cta" className="w-full"><Bolt size={15} /> Generate free</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
