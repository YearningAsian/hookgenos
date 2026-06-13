'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/studio/icon';
import { TypeBadge } from '@/components/ui/type-badge';
import { Bolt } from '@/components/ui/icons';
import { useStudio } from '@/components/studio/StudioProvider';
import { api, type BoardDetail } from '@/lib/api';

const ANGLE: Record<string, string> = {
  pain_point: 'Lead with a felt pain, then resolve it fast.',
  curiosity: 'Open an information gap and pay it off by line 3.',
  contrarian: 'Attack a held belief, then justify the flip.',
  list: 'Promise a finite, stealable payload.',
  story: 'Drop the viewer mid-scene, withhold the resolution.',
  how_to: 'Trade your labor for their time — make the number big.',
  shocking_stat: 'Open on a stark number, then imply the threat.',
  fear_fomo: 'Tie watching to an action they’re about to take.',
  question: 'Ask about their own behavior — they can’t not answer.',
};

export default function BriefPage() {
  const params = useParams<{ boardId: string }>();
  const router = useRouter();
  const { notify } = useStudio();
  const [detail, setDetail] = useState<BoardDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setDetail(await api.boards.get(params.boardId)); }
    catch { setDetail(null); }
    finally { setLoading(false); }
  }, [params.boardId]);

  // Fetch the board on mount; load() flips a loading flag the heuristic flags.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="su-empty"><span style={{ animation: 'hg-pulse 1.4s var(--ease-in-out) infinite', color: 'var(--brand-500)' }}><Bolt size={28} /></span></div>;
  }
  if (!detail) {
    return (
      <div className="su-empty">
        <Icon name="file" size={28} /><p>Couldn’t load that brief.</p>
        <button className="dz-reset" onClick={() => router.push('/dashboard/boards')} type="button">Back to boards</button>
      </div>
    );
  }

  const { board, hooks } = detail;
  const top = [...hooks].sort((a, b) => b.score - a.score);
  const angle = ANGLE[top[0]?.type] ?? 'Stop the scroll in the first 1.2 seconds.';

  const exportBrief = () => {
    const lines = [
      `# ${board.name} — Content Brief`,
      '',
      `## Primary angle`,
      angle,
      '',
      `## Hooks to shoot (${top.length})`,
      ...top.map((h) => `- [${h.score}] ${h.text}`),
      '',
      `## Shot list`,
      '- Cold open on hook line — face to camera, no intro.',
      '- Cut on the 2nd sentence; change framing or B-roll.',
      '- On-screen text mirrors the hook, 2–4 words max.',
      '- Pattern interrupt by second 3 (zoom, sound, or cut).',
      '',
      `## Do / Don't`,
      "- Do: front-load the most specific word.",
      '- Do: keep the hook under 12 words.',
      "- Don't: open with \"Hey guys\" or a logo.",
      "- Don't: bury the payoff past line 3.",
      '',
      `## CTA`,
      'End on a forward promise that mirrors the hook’s gap.',
    ];
    try {
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${board.name.replace(/[^\w]+/g, '-').toLowerCase()}-brief.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify('Could not export', 'error');
    }
  };

  return (
    <div className="bd br">
      <button className="su-back" onClick={() => router.push(`/dashboard/boards/${board.id}`)} type="button">
        <Icon name="chevronRight" size={15} style={{ transform: 'rotate(180deg)' }} /> {board.name}
      </button>

      <div className="br-doc">
        <div className="br-doc__head">
          <span className="su-dot" style={{ background: board.color }} />
          <div>
            <div className="br-doc__eyebrow">CONTENT BRIEF · AUTO-GENERATED</div>
            <h1 className="br-doc__title">{board.name}</h1>
          </div>
          <button className="dz-savefeed dz-savefeed--solid br-doc__export" onClick={exportBrief} type="button"><Icon name="download" size={15} /> Export</button>
        </div>

        <div className="br-block">
          <h3 className="br-block__h">Primary angle</h3>
          <p className="br-block__p">{angle}</p>
        </div>

        <div className="br-block">
          <h3 className="br-block__h">Hooks to shoot ({top.length})</h3>
          {top.length === 0 ? (
            <p className="br-block__p">No hooks saved yet — add some from Discover.</p>
          ) : (
            <ol className="br-hooks">
              {top.map((h) => (
                <li key={h.id} className="br-hook">
                  <span className="br-hook__score">{h.score}</span>
                  <span className="br-hook__text">{h.text}</span>
                  <TypeBadge type={h.type} />
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="br-cols">
          <div className="br-block">
            <h3 className="br-block__h">Shot list</h3>
            <ul className="br-list">
              <li>Cold open on hook line — face to camera, no intro.</li>
              <li>Cut on the 2nd sentence; change framing or B-roll.</li>
              <li>On-screen text mirrors the hook, 2–4 words max.</li>
              <li>Pattern interrupt by second 3 (zoom, sound, or cut).</li>
            </ul>
          </div>
          <div className="br-block">
            <h3 className="br-block__h">Do / Don&apos;t</h3>
            <ul className="br-list">
              <li><span className="br-do">Do</span> front-load the most specific word.</li>
              <li><span className="br-do">Do</span> keep the hook under 12 words.</li>
              <li><span className="br-dont">Don&apos;t</span> open with &quot;Hey guys&quot; or a logo.</li>
              <li><span className="br-dont">Don&apos;t</span> bury the payoff past line 3.</li>
            </ul>
          </div>
        </div>

        <div className="br-block">
          <h3 className="br-block__h">CTA</h3>
          <p className="br-block__p">End on a forward promise that mirrors the hook&apos;s gap — &quot;Part 2 tomorrow&quot; or &quot;Comment ‘hook’ for the full list.&quot;</p>
        </div>
      </div>
    </div>
  );
}
