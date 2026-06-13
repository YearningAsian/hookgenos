'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import type { BoardSummary, User } from '@/lib/api';
import type { StudioHook } from '@/lib/studio/types';
import { Bolt } from '@/components/ui/icons';
import { Icon } from './icon';
import { TeardownDrawer } from './TeardownDrawer';
import { CommandPalette } from './CommandPalette';

type ToastTone = 'success' | 'error';

/** The minimum shape needed to persist a hook into a board. StudioHook satisfies it. */
export interface SaveableHook {
  text: string;
  type: string;
  platform: string;
  score: number;
  niche?: string | null;
  sourceHandle?: string | null;
  sourceViews?: string | null;
}

interface StudioCtxValue {
  user: User | null;
  isPro: boolean;
  boards: BoardSummary[];
  refreshBoards: () => Promise<void>;
  savedKeys: Set<string>;
  saveHook: (hook: SaveableHook, boardId: string) => Promise<void>;
  createBoard: (name: string, color?: string) => Promise<BoardSummary | null>;
  createBoardAndSave: (hook: SaveableHook) => Promise<void>;
  forgetSaved: (text: string) => void;
  openTeardown: (hook: StudioHook) => void;
  notify: (message: string, tone?: ToastTone) => void;
  openCommand: () => void;
}

const StudioCtx = createContext<StudioCtxValue | null>(null);

export function useStudio(): StudioCtxValue {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error('useStudio must be used within <StudioProvider>');
  return ctx;
}

const BOARD_COLORS = ['#9333ea', '#10b981', '#f59e0b', '#fdba74', '#818cf8', '#f472b6', '#67e8f9'];

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'ready' | 'anon'>('loading');
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [teardown, setTeardown] = useState<StudioHook | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const forgetSaved = useCallback((text: string) => {
    setSavedKeys((s) => {
      if (!s.has(text)) return s;
      const next = new Set(s);
      next.delete(text);
      return next;
    });
  }, []);

  const refreshBoards = useCallback(async () => {
    try {
      const { boards: list } = await api.boards.list();
      setBoards(list);
    } catch {
      /* boards are non-critical; leave whatever we had */
    }
  }, []);

  // Auth gate + initial data.
  useEffect(() => {
    let alive = true;
    fetchCurrentUser().then((u) => {
      if (!alive) return;
      if (!u) {
        setAuthState('anon');
        router.replace('/login');
        return;
      }
      setUser(u);
      setAuthState('ready');
      refreshBoards();
    });
    return () => { alive = false; };
  }, [router, refreshBoards]);

  // ⌘K / Ctrl-K opens the command palette anywhere in the app.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const saveHook = useCallback(async (hook: SaveableHook, boardId: string) => {
    try {
      await api.boards.addHook(boardId, {
        text: hook.text,
        hookType: hook.type,
        platform: hook.platform,
        score: hook.score,
        niche: hook.niche ?? undefined,
        sourceHandle: hook.sourceHandle ?? undefined,
        sourceViews: hook.sourceViews ?? undefined,
      });
      setSavedKeys((s) => new Set(s).add(hook.text));
      const board = boards.find((b) => b.id === boardId);
      notify(`Saved to ${board ? board.name : 'board'}`);
      refreshBoards();
    } catch {
      notify('Could not save — try again', 'error');
    }
  }, [boards, notify, refreshBoards]);

  const createBoard = useCallback(async (name: string, color?: string): Promise<BoardSummary | null> => {
    try {
      const board = await api.boards.create({ name, color: color ?? BOARD_COLORS[boards.length % BOARD_COLORS.length] });
      await refreshBoards();
      return board;
    } catch {
      notify('Could not create board', 'error');
      return null;
    }
  }, [boards.length, notify, refreshBoards]);

  const createBoardAndSave = useCallback(async (hook: SaveableHook) => {
    const name = typeof window !== 'undefined' ? window.prompt('Name your new board') : null;
    if (!name || !name.trim()) return;
    const board = await createBoard(name.trim());
    if (board) await saveHook(hook, board.id);
  }, [createBoard, saveHook]);

  const openTeardown = useCallback((hook: StudioHook) => setTeardown(hook), []);
  const openCommand = useCallback(() => setCommandOpen(true), []);

  if (authState !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-brand-500" style={{ animation: 'hg-pulse 1.4s var(--ease-in-out) infinite' }}>
          <Bolt size={32} />
        </span>
      </div>
    );
  }

  const value: StudioCtxValue = {
    user,
    isPro: user?.plan === 'PRO',
    boards,
    refreshBoards,
    savedKeys,
    saveHook,
    createBoard,
    createBoardAndSave,
    forgetSaved,
    openTeardown,
    notify,
    openCommand,
  };

  return (
    <StudioCtx.Provider value={value}>
      {children}
      {teardown && <TeardownDrawer hook={teardown} onClose={() => setTeardown(null)} />}
      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
      {toast && (
        <div className="sh-toast" data-tone={toast.tone} role="status" aria-live="polite">
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={15} /> {toast.message}
        </div>
      )}
    </StudioCtx.Provider>
  );
}
