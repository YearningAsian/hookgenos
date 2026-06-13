import { cn } from '@/lib/utils';
import { Bolt } from './icons';

function tier(score: number): 'hot' | 'high' | 'mid' | 'low' {
  if (score >= 90) return 'hot';
  if (score >= 80) return 'high';
  if (score >= 70) return 'mid';
  return 'low';
}

export interface ScoreMeterProps {
  score: number;
  /** Show the zap + number chip above the track. */
  showPill?: boolean;
  className?: string;
}

/**
 * ScoreMeter — the signature "charge-up" performance gauge (.hg-score).
 * The fill bar animates from 0 and shifts cool→hot with the score.
 */
export function ScoreMeter({ score = 0, showPill = true, className }: ScoreMeterProps) {
  const t = tier(score);
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className={cn('hg-score', className)}>
      {showPill && (
        <div className="hg-score__head">
          <span className="hg-score__pill">
            <span style={{ color: '#facc15', display: 'inline-flex' }}><Bolt size={12} /></span>
            {score}
          </span>
        </div>
      )}
      <div className="hg-score__track">
        <div className="hg-score__fill" data-tier={t} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
