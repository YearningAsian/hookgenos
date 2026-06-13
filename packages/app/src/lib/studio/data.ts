import type { Creator, StudioHook } from './types';

/**
 * Curated Studio dataset — the editorial swipe library plus the Spyder creator
 * catalog. This is real, hand-picked content (not user data): appropriate for a
 * swipe file, and ported from the design system's `dataset.jsx`. `daysAgo` is
 * fixed (not random) so server and client render identically — no hydration drift.
 */

export const CREATORS: Creator[] = [
  { id: 'c1', name: 'Dana Park', handle: '@danabuilds', platform: 'tiktok', niche: 'SaaS', avatar: '#9333ea', followers: '412K', tracked: true, newCount: 6, avgScore: 88 },
  { id: 'c2', name: 'Marcus Lee', handle: '@marcuslifts', platform: 'instagram', niche: 'Fitness', avatar: '#10b981', followers: '1.2M', tracked: true, newCount: 3, avgScore: 91 },
  { id: 'c3', name: 'Priya Shah', handle: '@priyamoney', platform: 'youtube', niche: 'Finance', avatar: '#f59e0b', followers: '880K', tracked: true, newCount: 0, avgScore: 84 },
  { id: 'c4', name: 'The Hook Lab', handle: '@thehooklab', platform: 'twitter', niche: 'Productivity', avatar: '#818cf8', followers: '233K', tracked: false, newCount: 0, avgScore: 86 },
  { id: 'c5', name: 'Sofia Reyes', handle: '@sofiacooks', platform: 'tiktok', niche: 'Cooking', avatar: '#f472b6', followers: '2.1M', tracked: false, newCount: 0, avgScore: 89 },
  { id: 'c6', name: 'Jules Tan', handle: '@julesgrows', platform: 'linkedin', niche: 'SaaS', avatar: '#67e8f9', followers: '76K', tracked: false, newCount: 0, avgScore: 82 },
];

const CREATOR_BY_ID = new Map(CREATORS.map((c) => [c.id, c]));

export function creatorOf(id: string | undefined): Creator {
  return (id ? CREATOR_BY_ID.get(id) : undefined) ?? CREATORS[0];
}

// [text, type, platform, niche, score, creatorId, views, saves, daysAgo, fav?]
type LibTuple = [string, string, string, string, number, string, string, number, number, boolean?];

const LIB: LibTuple[] = [
  ['Stop scrolling — this is the advice I wish I had at 22.', 'pain_point', 'tiktok', 'Finance', 96, 'c3', '2.4M', 1840, 2, true],
  ['I analyzed 500 viral posts so you never have to guess again.', 'how_to', 'youtube', 'Productivity', 94, 'c4', '1.1M', 1320, 5],
  ['Nobody tells you this about your first 90 days in SaaS.', 'curiosity', 'linkedin', 'SaaS', 93, 'c1', '430K', 980, 1, true],
  ['Stop posting daily. Do this 3x a week instead.', 'contrarian', 'youtube', 'Productivity', 91, 'c4', '760K', 1110, 8],
  ['The 3-second mistake killing every reel you post.', 'pain_point', 'instagram', 'Fitness', 90, 'c2', '1.9M', 1560, 3],
  ['I grew to 100k with one boring habit nobody talks about.', 'curiosity', 'instagram', 'SaaS', 89, 'c1', '512K', 870, 11],
  ['5 hooks that doubled my watch time (steal them).', 'list', 'tiktok', 'Productivity', 88, 'c4', '690K', 1240, 4, true],
  ['You’re not bad at saving. You were never taught how.', 'pain_point', 'youtube', 'Finance', 88, 'c3', '980K', 760, 7],
  ['POV: you finally understand why your meals taste flat.', 'story', 'tiktok', 'Cooking', 87, 'c5', '3.2M', 2010, 6],
  ['The cold open that turns scrollers into subscribers.', 'how_to', 'linkedin', 'SaaS', 86, 'c6', '120K', 540, 13],
  ['Here’s what $0 to $10k/mo actually looked like for me.', 'story', 'youtube', 'Finance', 86, 'c3', '640K', 690, 9],
  ['Most fitness advice is written for people who already lift.', 'contrarian', 'instagram', 'Fitness', 85, 'c2', '1.1M', 980, 2],
  ['Your protein timing doesn’t matter. This does.', 'contrarian', 'instagram', 'Fitness', 85, 'c2', '870K', 720, 5],
  ['The one ingredient restaurants use that you never do.', 'curiosity', 'tiktok', 'Cooking', 84, 'c5', '2.8M', 1670, 14],
  ['97% of creators quit before this exact moment.', 'shocking_stat', 'youtube', 'Productivity', 84, 'c4', '540K', 610, 3],
  ['Read this before you open your laptop tomorrow.', 'fear_fomo', 'twitter', 'Productivity', 83, 'c4', '210K', 430, 10],
  ['What if your morning routine is the problem?', 'question', 'instagram', 'Fitness', 82, 'c2', '760K', 560, 6],
  ['I deleted my budgeting app. Here’s what happened.', 'story', 'tiktok', 'Finance', 82, 'c3', '1.3M', 940, 1],
  ['The SaaS onboarding tweak that cut churn by 40%.', 'shocking_stat', 'linkedin', 'SaaS', 81, 'c1', '88K', 410, 12],
  ['Steal this 4-line script that sells without selling.', 'how_to', 'linkedin', 'SaaS', 81, 'c6', '64K', 380, 4],
  ['Don’t learn to cook. Learn these 5 techniques.', 'list', 'youtube', 'Cooking', 80, 'c5', '1.8M', 1120, 8],
  ['Everyone’s wrong about cold starts. Let me explain.', 'contrarian', 'twitter', 'SaaS', 80, 'c1', '150K', 350, 2],
  ['The hook formula that built a 2M-follower account.', 'curiosity', 'tiktok', 'Fitness', 79, 'c2', '2.0M', 880, 15],
  ['You have 1.2 seconds. Most people waste all of them.', 'pain_point', 'tiktok', 'Productivity', 79, 'c4', '430K', 470, 7],
  ['Why I stopped chasing virality (and grew faster).', 'story', 'youtube', 'SaaS', 78, 'c1', '320K', 290, 3],
  ['3 words that make any opener 2x stickier.', 'list', 'instagram', 'Productivity', 77, 'c4', '280K', 360, 9],
  ['Your hook is fine. Your second line is the problem.', 'contrarian', 'twitter', 'Productivity', 76, 'c4', '190K', 300, 5],
  ['I tried every budgeting method so you don’t have to.', 'how_to', 'youtube', 'Finance', 75, 'c3', '410K', 250, 11],
];

export const LIBRARY: StudioHook[] = LIB.map(([text, type, platform, niche, score, creatorId, views, saves, daysAgo, fav], i) => ({
  id: `lib${i + 1}`,
  text,
  type,
  platform,
  niche,
  score,
  creatorId,
  views,
  saves,
  daysAgo,
  isFavorite: !!fav,
}));

/** A representative library hook for the Ripper demo, chosen by detected platform. */
export function sampleHookForPlatform(platform: string): StudioHook {
  return LIBRARY.find((h) => h.platform === platform) ?? LIBRARY[0];
}
