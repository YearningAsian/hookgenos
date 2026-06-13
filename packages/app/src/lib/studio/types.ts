/** A creator tracked in Spyder (curated catalog — see data.ts). */
export interface Creator {
  id: string;
  name: string;
  handle: string;
  platform: string;
  niche: string;
  /** Avatar tint (hex). */
  avatar: string;
  followers: string;
  tracked: boolean;
  newCount: number;
  avgScore: number;
}

/**
 * The unit rendered across Discover, Boards, Spyder and Ripper. A hook may come
 * from the curated library (has `creatorId`), a board snapshot (has
 * `sourceHandle`), a generation, or a rip — so most attribution fields are
 * optional and the card degrades gracefully.
 */
export interface StudioHook {
  id: string;
  text: string;
  type: string;
  platform: string;
  niche: string;
  score: number;
  creatorId?: string;
  sourceHandle?: string;
  views?: string;
  saves?: number;
  daysAgo?: number;
  isFavorite?: boolean;
  explanation?: string;
}
