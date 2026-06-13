import { describe, it, expect } from 'vitest';
import { teardownHook, remixHook, scoreFactors, analyzeAnatomy } from '../teardown';

describe('teardownHook', () => {
  it('maps a known type to its formula + trigger', () => {
    const td = teardownHook({ text: 'Stop scrolling — the advice I wish I had at 22.', type: 'pain_point', platform: 'tiktok', score: 96 });
    expect(td.formula).toBe('Pain-point opener');
    expect(td.trigger).toMatch(/loss aversion/i);
    expect(td.why.length).toBeGreaterThan(20);
  });

  it('falls back to the curiosity formula for an unknown type', () => {
    const td = teardownHook({ text: 'Some neutral hook text here', type: 'totally_unknown' });
    expect(td.formula).toBe('Curiosity gap');
  });

  it('always returns exactly four scored factors clamped to 0–100', () => {
    const td = teardownHook({ text: 'I analyzed 500 viral posts so you never have to.', type: 'how_to', platform: 'youtube', score: 94 });
    expect(td.factors).toHaveLength(4);
    expect(td.factors.map((f) => f.label)).toEqual(['Curiosity gap', 'Specificity', 'Emotional charge', 'Platform fit']);
    for (const f of td.factors) {
      expect(f.value).toBeGreaterThanOrEqual(0);
      expect(f.value).toBeLessThanOrEqual(100);
    }
  });

  it('is deterministic — same input yields the same teardown', () => {
    const input = { text: 'Nobody tells you this about your first 90 days in SaaS.', type: 'curiosity', platform: 'linkedin', score: 93 };
    expect(teardownHook(input)).toEqual(teardownHook(input));
  });
});

describe('scoreFactors', () => {
  it('rewards a number with higher specificity than a vague hook', () => {
    const specific = scoreFactors({ text: '97% of creators quit before this exact moment', type: 'shocking_stat' });
    const vague = scoreFactors({ text: 'You should really try harder at this thing', type: 'shocking_stat' });
    const specVal = specific.find((f) => f.label === 'Specificity')!.value;
    const vagueVal = vague.find((f) => f.label === 'Specificity')!.value;
    expect(specVal).toBeGreaterThan(vagueVal);
  });

  it('rewards power words with higher emotional charge', () => {
    const charged = scoreFactors({ text: 'Stop — this mistake is killing your reach', type: 'pain_point' });
    const flat = scoreFactors({ text: 'A few thoughts about posting content', type: 'pain_point' });
    const chargedVal = charged.find((f) => f.label === 'Emotional charge')!.value;
    const flatVal = flat.find((f) => f.label === 'Emotional charge')!.value;
    expect(chargedVal).toBeGreaterThan(flatVal);
  });

  it('gives TikTok a higher platform fit than general at the same score', () => {
    const tiktok = scoreFactors({ text: 'x', type: 'curiosity', platform: 'tiktok', score: 80 });
    const general = scoreFactors({ text: 'x', type: 'curiosity', platform: 'general', score: 80 });
    const t = tiktok.find((f) => f.label === 'Platform fit')!.value;
    const g = general.find((f) => f.label === 'Platform fit')!.value;
    expect(t).toBeGreaterThan(g);
  });
});

describe('analyzeAnatomy', () => {
  it('splits a punctuated hook into multiple labeled segments', () => {
    const segs = analyzeAnatomy('Stop scrolling — this is the advice I wish I had at 22', 'pain_point');
    expect(segs.length).toBeGreaterThanOrEqual(2);
    expect(segs[0].role).toBe('pattern interrupt');
    expect(segs.every((s) => s.phrase.length > 0)).toBe(true);
  });

  it('falls back to a word split for a hook with no punctuation', () => {
    const segs = analyzeAnatomy('Three boring words that change everything quietly', 'curiosity');
    expect(segs.length).toBeGreaterThanOrEqual(2);
  });

  it('never returns more than three segments', () => {
    const segs = analyzeAnatomy('One, two, three, four, five, six clauses here', 'list');
    expect(segs.length).toBeLessThanOrEqual(3);
  });
});

describe('remixHook', () => {
  it('substitutes the niche into every variant', () => {
    const variants = remixHook({ text: 'whatever', type: 'curiosity', score: 90 }, 'fitness');
    expect(variants).toHaveLength(3);
    expect(variants.every((v) => v.text.includes('fitness'))).toBe(true);
  });

  it('defaults to "your niche" when the niche is blank', () => {
    const variants = remixHook({ text: 'whatever', type: 'contrarian', score: 88 }, '   ');
    expect(variants[0].text).toContain('your niche');
  });

  it('produces gently descending scores floored at 72', () => {
    const variants = remixHook({ text: 'whatever', type: 'list', score: 75 }, 'SaaS');
    const scores = variants.map((v) => v.score);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
    expect(scores[1]).toBeGreaterThanOrEqual(scores[2]);
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(72);
  });

  it('falls back to curiosity remix for an unknown type', () => {
    const variants = remixHook({ text: 'whatever', type: 'mystery', score: 80 }, 'cooking');
    expect(variants).toHaveLength(3);
    expect(variants.every((v) => v.text.includes('cooking'))).toBe(true);
  });
});
