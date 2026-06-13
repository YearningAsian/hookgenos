import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface TypeMeta { c: string; label: string }

const TYPE: Record<string, TypeMeta> = {
  curiosity: { c: 'var(--type-curiosity)', label: 'Curiosity' },
  fear_fomo: { c: 'var(--type-fomo)', label: 'FOMO' },
  contrarian: { c: 'var(--type-contrarian)', label: 'Contrarian' },
  pain_point: { c: 'var(--type-painpoint)', label: 'Pain Point' },
  how_to: { c: 'var(--type-howto)', label: 'How-To' },
  list: { c: 'var(--type-list)', label: 'List' },
  story: { c: 'var(--type-story)', label: 'Story' },
  shocking_stat: { c: 'var(--type-stat)', label: 'Stat' },
  question: { c: 'var(--type-question)', label: 'Question' },
  challenge: { c: 'var(--type-contrarian)', label: 'Challenge' },
  personal: { c: 'var(--type-story)', label: 'Personal' },
  social_proof: { c: 'var(--type-list)', label: 'Social Proof' },
};

function hueStyle(c: string): CSSProperties {
  return {
    color: c,
    background: `color-mix(in srgb, ${c} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${c} 38%, transparent)`,
  };
}

/** TypeBadge — colour-coded hook-formula label (.hg-typebadge). */
export function TypeBadge({ type, label, className }: { type: string; label?: string; className?: string }) {
  const meta = TYPE[type] ?? { c: 'var(--zinc-300)', label: label ?? type };
  return (
    <span className={cn('hg-typebadge', className)} style={hueStyle(meta.c)}>
      {label ?? meta.label}
    </span>
  );
}

/** PlatformBadge — neutral pill naming the target platform (.hg-platbadge). */
export function PlatformBadge({ platform, glyph, className }: { platform: string; glyph?: string; className?: string }) {
  return (
    <span className={cn('hg-platbadge', className)}>
      {glyph && <span aria-hidden="true">{glyph}</span>}
      {platform}
    </span>
  );
}
