'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/studio/icon';
import { ViewHead, StudioHookCard } from '@/components/studio/shared';
import { useStudio } from '@/components/studio/StudioProvider';
import { useCardLayout } from '@/components/studio/useCardLayout';
import { Bolt } from '@/components/ui/icons';
import { api, type BoardDetail } from '@/lib/api';
import { timeAgo } from '@/lib/studio/format';
import type { StudioHook } from '@/lib/studio/types';

function toStudioHook(h: BoardDetail['hooks'][number]): StudioHook {
  return {
    id: h.id,
    text: h.text,
    type: h.type,
    platform: h.platform,
    niche: h.niche ?? '',
    score: h.score,
    sourceHandle: h.sourceHandle ?? undefined,
    views: h.sourceViews ?? undefined,
  };
}

export default function BoardDetailPage() {
  const params = useParams<{ boardId: string }>();
  const router = useRouter();
  const { notify, refreshBoards, forgetSaved } = useStudio();
  const [layout] = useCardLayout();
  const [detail, setDetail] = useState<BoardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.boards.get(params.boardId);
      setDetail(d);
    } catch {
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [params.boardId]);

  // Fetch the board on mount; load() flips a loading flag the heuristic flags.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const removeHook = async (hookId: string, text: string) => {
    try {
      await api.boards.removeHook(params.boardId, hookId);
      setDetail((d) => (d ? { ...d, hooks: d.hooks.filter((h) => h.id !== hookId) } : d));
      forgetSaved(text);
      refreshBoards();
      notify('Removed from board');
    } catch {
      notify('Could not remove — try again', 'error');
    }
  };

  const rename = async () => {
    if (!detail) return;
    const name = window.prompt('Rename board', detail.board.name);
    if (!name || !name.trim() || name.trim() === detail.board.name) return;
    try {
      await api.boards.update(detail.board.id, { name: name.trim() });
      setDetail((d) => (d ? { ...d, board: { ...d.board, name: name.trim() } } : d));
      refreshBoards();
    } catch {
      notify('Could not rename', 'error');
    }
  };

  const remove = async () => {
    if (!detail) return;
    if (!window.confirm(`Delete “${detail.board.name}” and its saved hooks? This cannot be undone.`)) return;
    try {
      await api.boards.delete(detail.board.id);
      refreshBoards();
      router.push('/dashboard/boards');
    } catch {
      notify('Could not delete', 'error');
    }
  };

  if (loading) {
    return <div className="su-empty"><span style={{ animation: 'hg-pulse 1.4s var(--ease-in-out) infinite', color: 'var(--brand-500)' }}><Bolt size={28} /></span></div>;
  }
  if (missing || !detail) {
    return (
      <div className="su-empty">
        <Icon name="layers" size={28} />
        <p>That board doesn’t exist (or isn’t yours).</p>
        <button className="dz-reset" onClick={() => router.push('/dashboard/boards')} type="button">Back to boards</button>
      </div>
    );
  }

  const { board, hooks } = detail;
  const cardLayout = layout === 'list' ? 'list' : 'grid';

  return (
    <div className="bd">
      <button className="su-back" onClick={() => router.push('/dashboard/boards')} type="button">
        <Icon name="chevronRight" size={15} style={{ transform: 'rotate(180deg)' }} /> Boards
      </button>

      <ViewHead
        title={<span className="bd-detail__title"><span className="su-dot" style={{ background: board.color }} />{board.name}</span>}
        sub={`${hooks.length} saved hook${hooks.length === 1 ? '' : 's'} · updated ${timeAgo(board.updatedAt)}`}
        right={
          <>
            <button className="su-teardown-btn" onClick={rename} type="button"><Icon name="settings" size={14} /> Rename</button>
            <button className="su-teardown-btn" onClick={remove} type="button"><Icon name="x" size={14} /> Delete</button>
            <button className="dz-savefeed dz-savefeed--solid" onClick={() => router.push(`/dashboard/boards/${board.id}/brief`)} type="button" disabled={hooks.length === 0}>
              <Icon name="file" size={15} /> Build brief
            </button>
          </>
        }
      />

      {hooks.length === 0 ? (
        <div className="su-empty">
          <Icon name="bookmark" size={28} />
          <p>This board is empty. Save hooks to it from Discover, Generate, or a teardown.</p>
          <button className="dz-savefeed dz-savefeed--solid" onClick={() => router.push('/dashboard')} type="button"><Icon name="compass" size={15} /> Browse Discover</button>
        </div>
      ) : (
        <div className={`dz-feed dz-feed--${cardLayout}`}>
          {hooks.map((h) => <StudioHookCard key={h.id} hook={toStudioHook(h)} layout={cardLayout} onRemove={() => removeHook(h.id, h.text)} />)}
        </div>
      )}
    </div>
  );
}
