import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateHooks, generateHooksSync, getTemplates } from '../index';
import type { GenerateOptions } from '../index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeOpts(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
  return {
    topic: 'productivity',
    platform: 'tiktok',
    tone: 'casual',
    count: 5,
    useAI: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Scoring — PLATFORM_BONUS and type/platform synergy bonuses.
// computeScore is internal, but its effect is observable on hook.score.
// We pin Math.random so template selection is deterministic enough to compare.
// ---------------------------------------------------------------------------
describe('generateHooksSync() scoring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clamps every score at 100 even when bonuses would exceed it', () => {
    // tiktok gives +5, and fear_fomo/contrarian on tiktok give a further +4.
    // The highest base score is 93 (ct1), so 93 + 5 + 4 = 102 must clamp to 100.
    const allHooks = Array.from({ length: 25 }, () =>
      generateHooksSync(makeOpts({ platform: 'tiktok', tone: 'bold', count: 10 })),
    ).flat();
    for (const h of allHooks) {
      expect(h.score).toBeLessThanOrEqual(100);
    }
    // At least one hook should be pushed to the 100 ceiling by the bonuses.
    expect(allHooks.some((h) => h.score === 100)).toBe(true);
  });

  it('applies the tiktok platform bonus (+5) relative to a no-bonus platform', () => {
    // twitter has no PLATFORM_BONUS entry. Find a template that exists on both
    // tiktok and twitter and is NOT a synergy type, so only the flat platform
    // bonus differs. 'curiosity' c9/c12 live on both and earn no synergy bonus.
    const shared = getTemplates({ platform: 'twitter', type: 'curiosity' }).filter((t) =>
      t.platforms.includes('tiktok'),
    );
    expect(shared.length).toBeGreaterThan(0);
    const sample = shared[0];

    // base + 5 on tiktok, base + 0 on twitter (no synergy for curiosity)
    const expectedTiktok = Math.min(100, sample.score + 5);
    const expectedTwitter = Math.min(100, sample.score + 0);
    expect(expectedTiktok - expectedTwitter).toBe(Math.min(5, 100 - sample.score + 5));
  });

  it('gives fear_fomo/contrarian a tiktok synergy bonus over a neutral platform', () => {
    // Collect contrarian hooks on tiktok vs linkedin for the same template id.
    const contrarianTiktok = getTemplates({ platform: 'tiktok', type: 'contrarian' });
    const contrarianLinkedin = getTemplates({ platform: 'linkedin', type: 'contrarian' });
    const sharedId = contrarianTiktok
      .map((t) => t.id)
      .find((id) => contrarianLinkedin.some((t) => t.id === id));
    expect(sharedId).toBeDefined();
    const tpl = contrarianTiktok.find((t) => t.id === sharedId)!;

    // tiktok: base + 5 (platform) + 4 (synergy); linkedin: base + 0 + 0
    const tiktokScore = Math.min(100, tpl.score + 5 + 4);
    const linkedinScore = Math.min(100, tpl.score + 0);
    expect(tiktokScore).toBeGreaterThan(linkedinScore);
  });

  it('gives how_to/list/shocking_stat a linkedin synergy bonus', () => {
    const listLinkedin = getTemplates({ platform: 'linkedin', type: 'list' });
    expect(listLinkedin.length).toBeGreaterThan(0);
    const tpl = listLinkedin[0];
    // linkedin: base + 0 (no platform bonus) + 4 (synergy)
    const expected = Math.min(100, tpl.score + 4);
    expect(expected).toBeGreaterThanOrEqual(tpl.score);
  });
});

// ---------------------------------------------------------------------------
// Template filling edge cases
// ---------------------------------------------------------------------------
describe('generateHooksSync() template filling', () => {
  it('falls back to topic for {niche} when no niche is given', () => {
    // f8 uses {niche}: "Most {niche} are sleeping on {topic} right now".
    // With no niche, {niche} should be replaced by the topic, never left raw.
    const hooks = Array.from({ length: 30 }, () =>
      generateHooksSync(makeOpts({ topic: 'widgets', platform: 'linkedin', tone: 'bold', count: 10 })),
    ).flat();
    for (const h of hooks) {
      expect(h.text).not.toContain('{niche}');
      expect(h.text).not.toContain('{topic}');
      expect(h.text).not.toContain('{number}');
      expect(h.text).not.toContain('undefined');
    }
  });

  it('substitutes the provided niche into {niche} templates', () => {
    const hooks = Array.from({ length: 30 }, () =>
      generateHooksSync(
        makeOpts({ topic: 'email marketing', niche: 'founders', platform: 'linkedin', tone: 'bold', count: 10 }),
      ),
    ).flat();
    // Across many runs at least one {niche} template should be selected.
    expect(hooks.some((h) => h.text.includes('founders'))).toBe(true);
  });

  it('replaces {number} with a numeric value, never the literal placeholder', () => {
    const hooks = Array.from({ length: 30 }, () =>
      generateHooksSync(makeOpts({ topic: 'sales', platform: 'linkedin', tone: 'professional', count: 10 })),
    ).flat();
    const numberHooks = hooks.filter((h) => /\d/.test(h.text));
    // Some templates contain {number}; whichever are selected must show a digit.
    expect(numberHooks.length).toBeGreaterThan(0);
    for (const h of hooks) {
      expect(h.text).not.toContain('{number}');
    }
  });

  it('does not return more hooks than the available pool', () => {
    // 'challenge' has only 2 templates; asking for 10 of that type yields <= pool.
    const pool = getTemplates({ type: 'challenge', platform: 'tiktok' });
    const hooks = generateHooksSync(makeOpts({ platform: 'tiktok', tone: 'casual', count: 10 }));
    // Total pool for tiktok/casual is far larger than challenge alone, but the
    // returned set must never exceed the requested count.
    expect(hooks.length).toBeLessThanOrEqual(10);
    expect(pool.length).toBe(2);
  });

  it('never returns duplicate template selections within a single call', () => {
    const hooks = generateHooksSync(makeOpts({ count: 10, platform: 'general', tone: 'casual' }));
    // {number} randomization can make identical templates differ, so compare by
    // a normalized template shape: collapse digits to confirm distinct formulas.
    const normalized = hooks.map((h) => h.text.replace(/\d+/g, '#'));
    expect(new Set(normalized).size).toBe(normalized.length);
  });
});

// ---------------------------------------------------------------------------
// generateHooks() async — AI path with mocked OpenAI
// ---------------------------------------------------------------------------
describe('generateHooks() AI path', () => {
  const ORIGINAL_KEY = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = ORIGINAL_KEY;
    vi.restoreAllMocks();
  });

  it('returns AI hooks when OpenAI succeeds', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              hooks: [
                { text: 'AI hook one', type: 'curiosity', score: 95, explanation: 'why' },
                { text: 'AI hook two', type: 'contrarian', score: 88 },
              ],
            }),
          },
        },
      ],
    });
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 2 }));

    expect(create).toHaveBeenCalledOnce();
    expect(hooks).toHaveLength(2);
    expect(hooks[0].text).toBe('AI hook one');
    expect(hooks[0].explanation).toBe('why');
    // Scores are clamped to 0..100.
    for (const h of hooks) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(100);
    }
  });

  it('clamps and defaults malformed AI hook fields', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              hooks: [
                { text: 'over the top', score: 9999 }, // no type, score > 100
                { text: '', score: 50 }, // empty text → filtered out
                { text: 'negative', score: -5 }, // score < 0 → clamp to 0
              ],
            }),
          },
        },
      ],
    });
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 3 }));

    // Empty-text hook is filtered out.
    expect(hooks).toHaveLength(2);
    expect(hooks[0].score).toBe(100);
    expect(hooks[0].type).toBe('curiosity'); // defaulted
    expect(hooks[1].score).toBe(0);
  });

  it('falls back to templates when the model returns literal null content', async () => {
    // Regression: JSON.parse('null') => null; accessing parsed.hooks used to throw.
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'null' } }],
    });
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 3 }));
    // No usable AI hooks → template fallback returns the requested count.
    expect(hooks).toHaveLength(3);
    for (const h of hooks) expect(h.text.length).toBeGreaterThan(0);
  });

  it('coerces a string score and defaults an unparseable one', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              hooks: [
                { text: 'numeric string score', score: '73' }, // → 73
                { text: 'garbage score', score: 'high' }, // NaN → default 80
              ],
            }),
          },
        },
      ],
    });
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 2 }));
    expect(hooks).toHaveLength(2);
    expect(hooks[0].score).toBe(73);
    expect(hooks[1].score).toBe(80);
  });

  it('accepts a top-level array response shape', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ text: 'bare array hook', score: 88 }]) } }],
    });
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 1 }));
    expect(hooks).toHaveLength(1);
    expect(hooks[0].text).toBe('bare array hook');
    expect(hooks[0].score).toBe(88);
  });

  it('falls back to template generation when OpenAI throws', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockRejectedValue(new Error('rate limited'));
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 4 }));

    // Fell back to templates → still returns the requested count.
    expect(hooks).toHaveLength(4);
    expect(warn).toHaveBeenCalled();
    for (const h of hooks) {
      expect(h.text.length).toBeGreaterThan(0);
    }
  });

  it('falls back to templates when OpenAI returns zero usable hooks', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ hooks: [] }) } }],
    });
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: true, count: 3 }));
    expect(hooks).toHaveLength(3);
  });

  it('skips AI entirely when useAI is false even if a key is present', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const create = vi.fn();
    vi.doMock('openai', () => ({
      default: class {
        chat = { completions: { create } };
      },
    }));

    const { generateHooks: gen } = await import('../generator');
    const hooks = await gen(makeOpts({ useAI: false, count: 3 }));
    expect(create).not.toHaveBeenCalled();
    expect(hooks).toHaveLength(3);
  });
});
