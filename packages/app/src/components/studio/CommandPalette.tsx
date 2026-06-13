'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icon';
import { useStudio } from './StudioProvider';
import { useFocusTrap } from './useFocusTrap';

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  kind: 'Go to' | 'Action';
  href?: string;
}

const ITEMS: CommandItem[] = [
  { id: 'discover', label: 'Discover', icon: 'compass', kind: 'Go to', href: '/dashboard' },
  { id: 'generate', label: 'Generate', icon: 'bolt', kind: 'Go to', href: '/dashboard/generate' },
  { id: 'spyder', label: 'Spyder', icon: 'radar', kind: 'Go to', href: '/dashboard/spyder' },
  { id: 'boards', label: 'Boards', icon: 'layers', kind: 'Go to', href: '/dashboard/boards' },
  { id: 'ripper', label: 'Ripper', icon: 'link', kind: 'Go to', href: '/dashboard/ripper' },
  { id: 'history', label: 'History', icon: 'history', kind: 'Go to', href: '/dashboard/history' },
  { id: 'settings', label: 'Settings', icon: 'settings', kind: 'Go to', href: '/settings' },
  { id: 'newboard', label: 'New board', icon: 'plus', kind: 'Action' },
];

/** Mounted only while open (the parent gates it), so state starts fresh each time. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createBoard } = useStudio();
  const paletteRef = useRef<HTMLDivElement>(null);
  useFocusTrap(paletteRef);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const filtered = useMemo(
    () => ITEMS.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  const activeId = filtered[active] ? `cp-opt-${filtered[active].id}` : undefined;
  // Keep the highlighted option scrolled into view as the active index moves.
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const run = async (item: CommandItem | undefined) => {
    if (!item) return;
    onClose();
    if (item.href) { router.push(item.href); return; }
    if (item.id === 'newboard') {
      const name = window.prompt('Name your new board');
      if (name && name.trim()) {
        await createBoard(name.trim());
        router.push('/dashboard/boards');
      }
    }
  };

  return (
    <div className="cp-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp" role="dialog" aria-label="Command palette" aria-modal="true" ref={paletteRef} tabIndex={-1}>
        <div className="cp-input">
          <Icon name="search" size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Jump to, search, or run a command…"
            aria-label="Command search"
            role="combobox"
            aria-expanded={filtered.length > 0}
            aria-controls="cp-listbox"
            aria-activedescendant={activeId}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); run(filtered[active]); }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div className="cp-list" role="listbox" id="cp-listbox" aria-label="Commands">
          {filtered.length === 0 && <div className="cp-empty">No matches.</div>}
          {filtered.map((i, idx) => (
            <button
              key={i.id}
              id={`cp-opt-${i.id}`}
              role="option"
              aria-selected={idx === active}
              className={`cp-item ${idx === active ? 'is-active' : ''}`}
              onClick={() => run(i)}
              onMouseEnter={() => setActive(idx)}
              type="button"
            >
              <Icon name={i.icon} size={16} />
              <span>{i.label}</span>
              <span className="cp-item__kind">{i.kind}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
