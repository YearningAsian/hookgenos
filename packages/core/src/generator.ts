import type { GenerateOptions, Hook, HookType } from './types';
import { TEMPLATES, getTemplates } from './templates';

const NUMBERS = [3, 5, 7, 10, 15, 21, 30, 50, 100, 500, 1000];
const PLATFORM_BONUS: Partial<Record<string, number>> = {
  tiktok: 5,
  instagram: 3,
  youtube: 2,
};

function fillTemplate(template: string, opts: GenerateOptions): string {
  return template
    .replace(/\{topic\}/g, opts.topic)
    .replace(/\{niche\}/g, opts.niche || opts.topic)
    .replace(/\{number\}/g, () => String(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]));
}

function computeScore(base: number, opts: GenerateOptions, type: HookType): number {
  let score = base + (PLATFORM_BONUS[opts.platform] ?? 0);
  if (['fear_fomo', 'contrarian'].includes(type) && ['tiktok', 'instagram'].includes(opts.platform)) score += 4;
  if (['how_to', 'list', 'shocking_stat'].includes(type) && opts.platform === 'linkedin') score += 4;
  return Math.min(100, score);
}

export function generateHooksSync(opts: GenerateOptions): Hook[] {
  const pool = getTemplates({ platform: opts.platform, tone: opts.tone });
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  // Ensure type variety — pick one per type first
  const usedTypes = new Set<HookType>();
  const selected: (typeof shuffled)[number][] = [];

  for (const t of shuffled) {
    if (selected.length >= opts.count) break;
    if (!usedTypes.has(t.type)) {
      selected.push(t);
      usedTypes.add(t.type);
    }
  }
  // Fill remaining with any template
  for (const t of shuffled) {
    if (selected.length >= opts.count) break;
    if (!selected.includes(t)) selected.push(t);
  }

  return selected.slice(0, opts.count).map((t) => ({
    text: fillTemplate(t.template, opts),
    type: t.type,
    score: computeScore(t.score, opts, t.type),
    platform: opts.platform,
  }));
}

export async function generateHooksWithAI(opts: GenerateOptions, apiKey: string): Promise<Hook[]> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });

  const examples = TEMPLATES.slice(0, 8).map((t) => `- ${t.example}`).join('\n');

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Generate ${opts.count} viral social media hooks for content about "${opts.topic}"${opts.niche ? ` in the ${opts.niche} niche` : ''}.

Platform: ${opts.platform}
Tone: ${opts.tone}

Use psychological formulas: curiosity gap, fear/FOMO, contrarian, pain point, story, shocking stat, how-to, list, question, challenge.

Example high-performing hooks:
${examples}

Return ONLY a JSON object: { "hooks": [{ "text": string, "type": string, "score": number (60-98), "explanation": string }] }

Rules:
- First 3 words must demand attention
- No emojis unless extremely strategic
- Be specific, not vague
- Each hook must use a different psychological formula`,
    }],
    response_format: { type: 'json_object' },
    temperature: 0.9,
    max_completion_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0].message.content || '{"hooks":[]}');
  const hooks: any[] = Array.isArray(parsed) ? parsed : (parsed.hooks || []);

  return hooks.map((h) => ({
    text: h.text || '',
    type: (h.type || 'curiosity') as HookType,
    score: Math.min(100, Math.max(0, h.score || 80)),
    platform: opts.platform,
    explanation: h.explanation,
  })).filter((h) => h.text.length > 0);
}

export async function generateHooks(opts: GenerateOptions): Promise<Hook[]> {
  if (opts.useAI && process.env.OPENAI_API_KEY) {
    try {
      const hooks = await generateHooksWithAI(opts, process.env.OPENAI_API_KEY);
      if (hooks.length > 0) return hooks;
    } catch (err) {
      console.warn('[hookgenos] AI generation failed, falling back to templates:', (err as Error).message);
    }
  }
  return generateHooksSync(opts);
}
