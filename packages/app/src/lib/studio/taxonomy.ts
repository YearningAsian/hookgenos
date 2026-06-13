/** Studio filter taxonomy — platforms (with source glyphs), hook formulas, niches. */

export interface PlatformDef {
  id: string;
  label: string;
  glyph: string;
}

export const PLATFORMS: PlatformDef[] = [
  { id: 'tiktok', label: 'TikTok', glyph: '♪' },
  { id: 'instagram', label: 'Reels', glyph: '◉' },
  { id: 'youtube', label: 'YT Shorts', glyph: '▶' },
  { id: 'twitter', label: 'X', glyph: '𝕏' },
  { id: 'linkedin', label: 'LinkedIn', glyph: 'in' },
];

export interface TypeDef {
  id: string;
  label: string;
}

export const TYPES: TypeDef[] = [
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'fear_fomo', label: 'FOMO' },
  { id: 'contrarian', label: 'Contrarian' },
  { id: 'pain_point', label: 'Pain Point' },
  { id: 'how_to', label: 'How-To' },
  { id: 'list', label: 'List' },
  { id: 'story', label: 'Story' },
  { id: 'shocking_stat', label: 'Stat' },
  { id: 'question', label: 'Question' },
];

export const NICHES = [
  'Fitness', 'SaaS', 'Finance', 'Cooking', 'Beauty',
  'Real estate', 'Productivity', 'Gaming', 'Travel', 'Parenting',
];

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function platformGlyph(id: string): string {
  return PLATFORM_BY_ID.get(id)?.glyph ?? '✦';
}

export function platformLabel(id: string): string {
  return PLATFORM_BY_ID.get(id)?.label ?? id;
}
