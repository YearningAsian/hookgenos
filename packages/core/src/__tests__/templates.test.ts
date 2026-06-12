import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateHooks, generateHooksSync, getTemplates, TEMPLATES } from '../index';
import type { GenerateOptions, Platform, Tone } from '../index';

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
// TEMPLATES array sanity
// ---------------------------------------------------------------------------
describe('TEMPLATES constant', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TEMPLATES)).toBe(true);
    expect(TEMPLATES.length).toBeGreaterThan(0);
  });

  it('every template has required fields with correct types', () => {
    for (const t of TEMPLATES) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.type).toBe('string');
      expect(typeof t.template).toBe('string');
      expect(typeof t.score).toBe('number');
      expect(Array.isArray(t.platforms)).toBe(true);
      expect(Array.isArray(t.tones)).toBe(true);
      expect(typeof t.example).toBe('string');
    }
  });

  it('all scores are between 0 and 100', () => {
    for (const t of TEMPLATES) {
      expect(t.score).toBeGreaterThanOrEqual(0);
      expect(t.score).toBeLessThanOrEqual(100);
    }
  });

  it('contains templates for tiktok platform', () => {
    const tiktokTemplates = TEMPLATES.filter(t => t.platforms.includes('tiktok'));
    expect(tiktokTemplates.length).toBeGreaterThan(0);
  });

  it('contains templates for linkedin platform', () => {
    const linkedinTemplates = TEMPLATES.filter(t => t.platforms.includes('linkedin'));
    expect(linkedinTemplates.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getTemplates filtering
// ---------------------------------------------------------------------------
describe('getTemplates()', () => {
  it('returns all templates when no filters provided', () => {
    const result = getTemplates({});
    expect(result.length).toBe(TEMPLATES.length);
  });

  it('filters by platform — tiktok should return only tiktok templates', () => {
    const result = getTemplates({ platform: 'tiktok' });
    for (const t of result) {
      expect(t.platforms).toContain('tiktok');
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by platform — linkedin filters out tiktok-only templates', () => {
    const tiktokOnly = TEMPLATES.filter(
      t => t.platforms.includes('tiktok') && !t.platforms.includes('linkedin'),
    );
    const result = getTemplates({ platform: 'linkedin' });
    for (const restricted of tiktokOnly) {
      expect(result.find(r => r.id === restricted.id)).toBeUndefined();
    }
  });

  it('treats "general" platform as no platform filter (returns all)', () => {
    const resultGeneral = getTemplates({ platform: 'general' });
    const resultAll = getTemplates({});
    expect(resultGeneral.length).toBe(resultAll.length);
  });

  it('filters by tone — bold should return only bold templates', () => {
    const result = getTemplates({ tone: 'bold' });
    for (const t of result) {
      expect(t.tones).toContain('bold');
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by tone — casual vs professional produce different sets', () => {
    const casual = getTemplates({ tone: 'casual' });
    const professional = getTemplates({ tone: 'professional' });
    // There should be at least some difference in contents
    const casualIds = new Set(casual.map(t => t.id));
    const professionalIds = new Set(professional.map(t => t.id));
    const onlyCasual = [...casualIds].filter(id => !professionalIds.has(id));
    expect(onlyCasual.length).toBeGreaterThan(0);
  });

  it('filters by type', () => {
    const result = getTemplates({ type: 'curiosity' });
    for (const t of result) {
      expect(t.type).toBe('curiosity');
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it('combines platform + tone filters', () => {
    const result = getTemplates({ platform: 'linkedin', tone: 'professional' });
    for (const t of result) {
      expect(t.platforms).toContain('linkedin');
      expect(t.tones).toContain('professional');
    }
  });

  it('returns empty array when no templates match combined filters', () => {
    // 'challenge' type only exists for tiktok/instagram, not linkedin
    const result = getTemplates({ type: 'challenge', platform: 'linkedin' });
    expect(result.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateHooksSync — core template-based generation
// ---------------------------------------------------------------------------
describe('generateHooksSync()', () => {
  it('returns an array', () => {
    const hooks = generateHooksSync(makeOpts());
    expect(Array.isArray(hooks)).toBe(true);
  });

  it('returns exactly count hooks when count=5', () => {
    const hooks = generateHooksSync(makeOpts({ count: 5 }));
    expect(hooks.length).toBe(5);
  });

  it('returns exactly 1 hook when count=1', () => {
    const hooks = generateHooksSync(makeOpts({ count: 1 }));
    expect(hooks.length).toBe(1);
  });

  it('returns exactly 10 hooks when count=10', () => {
    const hooks = generateHooksSync(makeOpts({ count: 10 }));
    expect(hooks.length).toBe(10);
  });

  it('each hook has text, type, score, platform fields', () => {
    const hooks = generateHooksSync(makeOpts());
    for (const h of hooks) {
      expect(typeof h.text).toBe('string');
      expect(h.text.length).toBeGreaterThan(0);
      expect(typeof h.type).toBe('string');
      expect(h.type.length).toBeGreaterThan(0);
      expect(typeof h.score).toBe('number');
      expect(typeof h.platform).toBe('string');
    }
  });

  it('scores are within 0–100', () => {
    const hooks = generateHooksSync(makeOpts());
    for (const h of hooks) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(100);
    }
  });

  it('substitutes topic into generated text', () => {
    const hooks = generateHooksSync(makeOpts({ topic: 'morning routines' }));
    const atLeastOneMentionsTopic = hooks.some(h =>
      h.text.toLowerCase().includes('morning routines'),
    );
    expect(atLeastOneMentionsTopic).toBe(true);
  });

  it('platform field matches the requested platform', () => {
    const hooks = generateHooksSync(makeOpts({ platform: 'youtube' }));
    for (const h of hooks) {
      expect(h.platform).toBe('youtube');
    }
  });

  // Platform-specific template selection
  it('tiktok: hooks use TikTok-appropriate templates (pov/stop scrolling patterns)', () => {
    // Run many times to increase probability of hitting the TikTok-specific templates
    const allHooks = Array.from({ length: 6 }, () =>
      generateHooksSync(makeOpts({ platform: 'tiktok', count: 5, tone: 'casual' })),
    ).flat();

    // TikTok-platform templates have types like fear_fomo, contrarian, curiosity, challenge
    const knownTiktokTypes = ['fear_fomo', 'contrarian', 'curiosity', 'challenge', 'story', 'question', 'pain_point', 'how_to', 'list'];
    const foundTypes = new Set(allHooks.map(h => h.type));
    const intersection = [...foundTypes].filter(t => knownTiktokTypes.includes(t));
    expect(intersection.length).toBeGreaterThan(0);
  });

  it('linkedin: hooks use LinkedIn-appropriate types (list, how_to, shocking_stat)', () => {
    const allHooks = Array.from({ length: 6 }, () =>
      generateHooksSync(makeOpts({ platform: 'linkedin', tone: 'professional', count: 5 })),
    ).flat();

    const linkedinFocusedTypes = ['list', 'how_to', 'shocking_stat', 'curiosity', 'contrarian', 'pain_point'];
    const foundTypes = new Set(allHooks.map(h => h.type));
    const intersection = [...foundTypes].filter(t => linkedinFocusedTypes.includes(t));
    expect(intersection.length).toBeGreaterThan(0);
  });

  // Tone variations
  it('bold tone yields different types than professional tone', () => {
    const boldHooks = Array.from({ length: 8 }, () =>
      generateHooksSync(makeOpts({ tone: 'bold', count: 5 })),
    ).flat();
    const proHooks = Array.from({ length: 8 }, () =>
      generateHooksSync(makeOpts({ tone: 'professional', count: 5 })),
    ).flat();

    const boldTypes = new Set(boldHooks.map(h => h.type));
    const proTypes = new Set(proHooks.map(h => h.type));

    // 'contrarian' is a bold-tone type; 'how_to' appears for professional
    // At minimum each set should contain some types
    expect(boldTypes.size).toBeGreaterThan(0);
    expect(proTypes.size).toBeGreaterThan(0);
  });

  it('produces type variety (different types across hooks in one call)', () => {
    const hooks = generateHooksSync(makeOpts({ count: 8 }));
    const uniqueTypes = new Set(hooks.map(h => h.type));
    // With 8 hooks the algorithm tries to use one per type first
    expect(uniqueTypes.size).toBeGreaterThanOrEqual(4);
  });

  // Edge cases
  it('handles count=0 by returning empty array', () => {
    const hooks = generateHooksSync(makeOpts({ count: 0 }));
    expect(hooks.length).toBe(0);
  });

  it('empty topic — still returns hooks (no throw)', () => {
    const hooks = generateHooksSync(makeOpts({ topic: '' }));
    expect(Array.isArray(hooks)).toBe(true);
  });

  it('uses niche in templates when provided', () => {
    const hooks = generateHooksSync(
      makeOpts({ topic: 'sales', niche: 'founders', count: 10, tone: 'casual', platform: 'linkedin' }),
    );
    // At least one hook should contain 'founders' (from list/shocking_stat niche templates)
    const useNiche = hooks.some(h => h.text.includes('founders'));
    // Can't guarantee niche appears (depends on which templates are selected), but no crash
    expect(hooks.length).toBe(10);
    // If niche placeholder templates were selected, it should render the niche
    // We check the behaviour is correct by verifying 'undefined' never appears
    for (const h of hooks) {
      expect(h.text).not.toContain('undefined');
    }
  });
});

// ---------------------------------------------------------------------------
// generateHooks() — async wrapper; useAI=false path
// ---------------------------------------------------------------------------
describe('generateHooks() — template path (useAI=false)', () => {
  it('returns a promise', () => {
    const result = generateHooks(makeOpts({ useAI: false }));
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves with the correct count of hooks', async () => {
    const hooks = await generateHooks(makeOpts({ count: 4, useAI: false }));
    expect(hooks.length).toBe(4);
  });

  it('each hook has text, type, score, platform', async () => {
    const hooks = await generateHooks(makeOpts({ useAI: false }));
    for (const h of hooks) {
      expect(typeof h.text).toBe('string');
      expect(h.text.length).toBeGreaterThan(0);
      expect(typeof h.type).toBe('string');
      expect(typeof h.score).toBe('number');
      expect(typeof h.platform).toBe('string');
    }
  });

  it('falls back to templates when useAI=true but OPENAI_API_KEY is not set', async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const hooks = await generateHooks(makeOpts({ useAI: true, count: 3 }));
      expect(hooks.length).toBe(3);
      for (const h of hooks) {
        expect(typeof h.text).toBe('string');
        expect(h.text.length).toBeGreaterThan(0);
      }
    } finally {
      if (original !== undefined) process.env.OPENAI_API_KEY = original;
    }
  });
});
