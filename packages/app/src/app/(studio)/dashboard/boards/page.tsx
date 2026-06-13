'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/studio/icon';
import { ViewHead } from '@/components/studio/shared';
import { useStudio } from '@/components/studio/StudioProvider';
import { timeAgo } from '@/lib/studio/format';
import type { BoardSummary } from '@/lib/api';

function BoardCard({ board, onOpen }: { board: BoardSummary; onOpen: () => void }) {
  const peeks = board.preview.slice(0, 3);
  return (
    <button className="bd-card" onClick={onOpen} type="button">
      <div className="bd-card__cover" style={{ '--bc': board.color } as React.CSSProperties}>
        {peeks.length === 0
          ? <span className="bd-card__empty">Empty board</span>
          : peeks.map((text, i) => <span key={i} className="bd-card__peek" style={{ top: 14 + i * 22 }}>{text}</span>)}
        <span className="bd-card__glow" />
      </div>
      <div className="bd-card__info">
        <div className="bd-card__row">
          <span className="su-dot" style={{ background: board.color }} />
          <h3 className="bd-card__name">{board.name}</h3>
        </div>
        <div className="bd-card__meta">
          <span>{board.hookCount} hook{board.hookCount === 1 ? '' : 's'}</span>
          <span>·</span>
          <span>{timeAgo(board.updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}

export default function BoardsPage() {
  const router = useRouter();
  const { boards, refreshBoards, createBoard } = useStudio();

  useEffect(() => { refreshBoards(); }, [refreshBoards]);

  const newBoard = async () => {
    const name = window.prompt('Name your new board');
    if (!name || !name.trim()) return;
    const board = await createBoard(name.trim());
    if (board) router.push(`/dashboard/boards/${board.id}`);
  };

  return (
    <div className="bd">
      <ViewHead
        icon="layers"
        title="Boards"
        sub="Your swipe file — saved hooks organized by campaign, client, or angle."
        right={<button className="dz-savefeed dz-savefeed--solid" onClick={newBoard} type="button"><Icon name="plus" size={15} /> New board</button>}
      />

      {boards.length === 0 ? (
        <div className="su-empty">
          <Icon name="layers" size={28} />
          <p>No boards yet. Save a hook from Discover, or start one here.</p>
          <button className="dz-savefeed dz-savefeed--solid" onClick={newBoard} type="button"><Icon name="plus" size={15} /> New board</button>
        </div>
      ) : (
        <div className="bd-grid">
          {boards.map((b) => <BoardCard key={b.id} board={b} onOpen={() => router.push(`/dashboard/boards/${b.id}`)} />)}
          <button className="bd-new" onClick={newBoard} type="button"><Icon name="plus" size={20} /> New board</button>
        </div>
      )}
    </div>
  );
}
