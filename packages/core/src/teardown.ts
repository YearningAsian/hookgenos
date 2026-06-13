import type { HookType } from './types';

/**
 * HookGenOS — Teardown engine.
 *
 * A deterministic, dependency-free analysis of *why* a hook works: its
 * psychological formula, its anatomy (phrase → role), four scored factors, and
 * a niche remix. Pure functions only (no network, no randomness) so the same
 * hook always tears down the same way and the module is safe to bundle on the
 * client. This is the production replacement for the Studio prototype's
 * hand-authored `TD_BANK`.
 */

export interface TeardownInput {
  text: string;
  type: string;
  platform?: string;
  score?: number;
}

export interface AnatomySegment {
  phrase: string;
  role: string;
}

export interface ScoreFactor {
  label: string;
  /** 0–100 */
  value: number;
}

export interface Teardown {
  formula: string;
  trigger: string;
  structure: AnatomySegment[];
  factors: ScoreFactor[];
  why: string;
}

interface FormulaMeta {
  formula: string;
  trigger: string;
  why: string;
}

const FORMULA: Record<string, FormulaMeta> = {
  pain_point: {
    formula: 'Pain-point opener',
    trigger: 'Loss aversion + self-recognition',
    why: 'It names a felt pain and implicates the viewer in the same breath, so relevance lands before they can swipe.',
  },
  curiosity: {
    formula: 'Curiosity gap',
    trigger: 'Information gap (Loewenstein)',
    why: 'It promises a secret with a concrete boundary — specific enough to feel real, withheld enough to demand the next line.',
  },
  contrarian: {
    formula: 'Contrarian flip',
    trigger: 'Pattern violation',
    why: 'It attacks a belief the viewer already holds, forcing them to defend or update — both keep them watching.',
  },
  list: {
    formula: 'Numbered list',
    trigger: 'Closure / completeness',
    why: 'A number sets a clear contract for length and payoff; the low-effort framing drops the cost of engaging to near zero.',
  },
  story: {
    formula: 'Story lure',
    trigger: 'Narrative transport',
    why: 'It drops the viewer mid-scene; the unresolved transformation is the bait that pulls them through the cut.',
  },
  how_to: {
    formula: 'How-to / utility',
    trigger: 'Effort-saving',
    why: "It trades the creator's labor for the viewer's time — an irresistible exchange when the number is big.",
  },
  shocking_stat: {
    formula: 'Shocking stat',
    trigger: 'Surprise + implied threat',
    why: 'A stark number plus an implied threat ("you might be in it") raises the stakes instantly.',
  },
  fear_fomo: {
    formula: 'FOMO trigger',
    trigger: 'Scarcity + urgency',
    why: 'It ties watching to an action the viewer is about to take anyway, making skipping feel costly.',
  },
  question: {
    formula: 'Open question',
    trigger: 'Self-referential curiosity',
    why: "A question about the viewer's own behavior is nearly impossible not to silently answer.",
  },
  challenge: {
    formula: 'Challenge',
    trigger: 'Commitment + identity',
    why: 'A concrete, time-boxed dare invites the viewer to picture themselves doing it — and to stay for the rules.',
  },
  personal: {
    formula: 'Personal reveal',
    trigger: 'Authenticity + parasocial trust',
    why: 'A first-person admission lowers the guard the algorithm raised, buying a few seconds of earned attention.',
  },
  social_proof: {
    formula: 'Social proof',
    trigger: 'Bandwagon + credibility',
    why: 'Borrowed authority ("everyone who wins does this") makes the claim feel pre-validated before any evidence.',
  },
};

const DEFAULT_FORMULA: FormulaMeta = FORMULA.curiosity;

function formulaMeta(type: string): FormulaMeta {
  return FORMULA[type] ?? DEFAULT_FORMULA;
}

/** The interrupt words that earn a "pattern interrupt" role on the opening clause. */
const INTERRUPT = /^(stop|don'?t|wait|read|watch|warning|never|pov|hot take|unpopular opinion)\b/i;
const WITHHOLD =
  /\b(nobody|no one|secret|the reason|why|what|this one|the one thing|nobody tells|wish i|here'?s what|before you|what nobody)\b/i;
const NUMBERY = /(\d|%|\$)/;

function clamp(n: number, lo = 40, hi = 98): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function countMatches(text: string, words: string[]): number {
  const lower = ` ${text.toLowerCase()} `;
  let n = 0;
  for (const w of words) {
    // Word-boundary-ish: count non-overlapping occurrences.
    let idx = lower.indexOf(w);
    while (idx !== -1) {
      n += 1;
      idx = lower.indexOf(w, idx + w.length);
    }
  }
  return n;
}

/**
 * Split a hook into up to three ordered clauses and label each with the role it
 * plays. Falls back to a word-based split when the hook has no internal
 * punctuation so every hook yields at least two segments.
 */
export function analyzeAnatomy(text: string, type: string): AnatomySegment[] {
  const trimmed = text.trim();
  let clauses = trimmed
    .split(/\s*[—–\-:,.;?!]\s+|\s*[—–]\s*/)
    .map((c) => c.trim().replace(/[.?!]+$/, ''))
    .filter(Boolean);

  if (clauses.length < 2) {
    const words = trimmed.replace(/[.?!]+$/, '').split(/\s+/);
    if (words.length >= 4) {
      const head = words.slice(0, 3).join(' ');
      const tail = words.slice(3).join(' ');
      clauses = [head, tail];
    } else {
      clauses = [trimmed.replace(/[.?!]+$/, '')];
    }
  }
  clauses = clauses.slice(0, 3);

  const last = clauses.length - 1;
  return clauses.map((phrase, i) => ({ phrase, role: roleFor(phrase, i, last, type) }));
}

function roleFor(phrase: string, index: number, lastIndex: number, type: string): string {
  if (index === 0) {
    if (INTERRUPT.test(phrase)) return 'pattern interrupt';
    if (NUMBERY.test(phrase)) return 'specific anchor';
    if (WITHHOLD.test(phrase)) return 'curiosity hook';
    return 'opening frame';
  }
  if (NUMBERY.test(phrase)) return type === 'list' ? 'finite payload' : 'specific anchor';
  if (WITHHOLD.test(phrase)) return 'withheld payoff';
  if (index === lastIndex) {
    if (/\?$/.test(phrase) || type === 'question') return 'reframe';
    if (type === 'contrarian') return 'the flip';
    if (type === 'how_to') return 'value transfer';
    if (type === 'story') return 'transformation promise';
    return 'forward promise';
  }
  return 'supporting beat';
}

const CURIOSITY_WORDS = [
  'nobody', 'no one', 'secret', 'the reason', 'why', 'what', 'this one', 'the one thing',
  'nobody tells', 'wish i', "here's what", 'before you', 'what nobody', 'this', 'hidden',
];
const POWER_WORDS = [
  'stop', 'never', 'always', 'mistake', 'fail', 'failing', 'killing', 'secret', 'warning',
  'terrible', 'scary', 'broke', 'quit', 'lost', 'losing', 'ruined', 'sabotag', 'wrong',
  'overrated', 'almost', 'struggling', 'tired',
];
const TIME_WORDS = ['day', 'days', 'week', 'month', 'months', 'year', 'years', 'second', 'seconds', 'minute', 'minutes'];

const PLATFORM_FIT: Record<string, number> = {
  tiktok: 6, instagram: 4, youtube: 3, twitter: 2, linkedin: 2, general: 0,
};

function curiosityGap(text: string): number {
  let v = 54 + countMatches(text, CURIOSITY_WORDS) * 11;
  if (/\?\s*$/.test(text.trim())) v += 8;
  return clamp(v);
}

function specificity(text: string): number {
  let v = 50;
  if (/\d/.test(text)) v += 18;
  if (/[%$]/.test(text)) v += 10;
  if (countMatches(text, TIME_WORDS) > 0) v += 9;
  // Proper-noun-ish: capitalized words that are not the sentence opener.
  const caps = text.split(/\s+/).slice(1).filter((w) => /^[A-Z][a-z]{2,}/.test(w)).length;
  v += Math.min(16, caps * 8);
  return clamp(v);
}

function emotionalCharge(text: string): number {
  let v = 52 + countMatches(text, POWER_WORDS) * 10;
  if (/!/.test(text)) v += 6;
  return clamp(v);
}

function platformFit(platform: string | undefined, score: number | undefined): number {
  const base = typeof score === 'number' ? score : 80;
  const bonus = PLATFORM_FIT[(platform ?? 'general').toLowerCase()] ?? 0;
  return clamp(base + bonus, 50, 98);
}

export function scoreFactors(hook: TeardownInput): ScoreFactor[] {
  return [
    { label: 'Curiosity gap', value: curiosityGap(hook.text) },
    { label: 'Specificity', value: specificity(hook.text) },
    { label: 'Emotional charge', value: emotionalCharge(hook.text) },
    { label: 'Platform fit', value: platformFit(hook.platform, hook.score) },
  ];
}

/** Full teardown of a single hook. Deterministic. */
export function teardownHook(hook: TeardownInput): Teardown {
  const meta = formulaMeta(hook.type);
  return {
    formula: meta.formula,
    trigger: meta.trigger,
    why: meta.why,
    structure: analyzeAnatomy(hook.text, hook.type),
    factors: scoreFactors(hook),
  };
}

/* --------------------------------- Remix --------------------------------- */

type RemixFn = (niche: string) => string[];

const REMIX: Record<string, RemixFn> = {
  pain_point: (n) => [
    `Stop scrolling — this is the ${n} advice I wish I had on day one.`,
    `The 3-second ${n} mistake quietly killing your reach.`,
    `You're not bad at ${n}. You were never taught the part that matters.`,
  ],
  curiosity: (n) => [
    `Nobody tells you this about your first 90 days in ${n}.`,
    `The ${n} habit nobody talks about (but everyone who wins does).`,
    `One ${n} tweak changed everything — here's the exact move.`,
  ],
  contrarian: (n) => [
    `Stop doing ${n} the way everyone tells you. Do this instead.`,
    `Most ${n} advice is written for people who already made it.`,
    `Everyone's wrong about ${n}. Let me show you why.`,
  ],
  list: (n) => [
    `5 ${n} hooks that doubled my watch time — steal them.`,
    `3 ${n} moves that make any opener 2x stickier.`,
    `4 ${n} scripts that sell without selling.`,
  ],
  story: (n) => [
    `POV: you finally understand why your ${n} results stalled.`,
    `Here's what going all-in on ${n} actually looked like.`,
    `I quit the "right" way to do ${n}. Here's what happened.`,
  ],
  how_to: (n) => [
    `I analyzed 500 ${n} posts so you never have to guess again.`,
    `The ${n} cold open that turns scrollers into subscribers.`,
    `Steal this 4-line ${n} script that does the heavy lifting.`,
  ],
  shocking_stat: (n) => [
    `97% of people quit ${n} right before this exact moment.`,
    `One ${n} number that should genuinely scare you.`,
    `The ${n} stat that flips how you'll post forever.`,
  ],
  fear_fomo: (n) => [
    `Read this before your next ${n} post goes out.`,
    `If you do ${n}, you're about to lose the easiest win there is.`,
    `Everyone in ${n} is doing this. You're not. Yet.`,
  ],
  question: (n) => [
    `What if your ${n} routine is the actual problem?`,
    `Why does nobody in ${n} talk about this?`,
    `Is your ${n} hook fine — or is your second line killing it?`,
  ],
};

export interface RemixVariant {
  text: string;
  type: string;
  platform?: string;
  niche: string;
  score: number;
}

/**
 * Remix a hook into a chosen niche, reusing its psychological formula. Returns
 * three variants with gently descending scores anchored to the original.
 */
export function remixHook(hook: TeardownInput, rawNiche: string): RemixVariant[] {
  const niche = (rawNiche || '').trim() || 'your niche';
  const fn = REMIX[hook.type] ?? REMIX.curiosity;
  const base = typeof hook.score === 'number' ? hook.score : 84;
  return fn(niche).map((text, i) => ({
    text,
    type: hook.type,
    platform: hook.platform,
    niche,
    score: Math.max(72, base - 2 - i * 3),
  }));
}
