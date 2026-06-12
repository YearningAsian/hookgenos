import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateHooks } from '@hookgenos/core';
import { prisma } from '../lib/prisma';
import { getCached } from '../lib/redis';
import { authenticate } from '../middleware/auth';

const generateSchema = z.object({
  topic: z.string().min(1).max(200),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'general']).default('general'),
  niche: z.string().max(100).optional(),
  tone: z.enum(['casual', 'professional', 'urgent', 'curious', 'bold']).default('casual'),
  count: z.number().int().min(1).max(10).default(5),
  useAI: z.boolean().default(false),
});

const FREE_DAILY_LIMIT = 10;
const TRENDING_CACHE_TTL = 300; // 5 minutes

export async function hooksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/generate', async (req, reply) => {
    const payload = req.user as { sub: string };
    let body;
    try {
      body = generateSchema.parse(req.body);
    } catch (err: any) {
      return reply.code(400).send({ error: 'Validation error', details: err.errors });
    }

    // Fetch user + today's count in parallel
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [user, todayCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.sub } }),
      prisma.generatedHook.count({
        where: { userId: payload.sub, createdAt: { gte: today } },
      }),
    ]);

    if (!user) return reply.code(404).send({ error: 'User not found' });

    if (user.plan === 'FREE' && todayCount >= FREE_DAILY_LIMIT) {
      return reply.code(429).send({
        error: 'Daily limit reached',
        message: `Free plan allows ${FREE_DAILY_LIMIT} hooks per day. Upgrade to Pro for unlimited.`,
        limitReached: true,
        upgradeUrl: '/pricing',
      });
    }

    const hooks = await generateHooks({
      topic: body.topic,
      platform: body.platform,
      niche: body.niche,
      tone: body.tone,
      count: body.count,
      useAI: body.useAI && !!process.env.OPENAI_API_KEY,
    });

    if (hooks.length > 0) {
      await prisma.generatedHook.createMany({
        data: hooks.map((h) => ({
          userId: payload.sub,
          content: h.text,
          platform: body.platform,
          niche: body.niche ?? null,
          tone: body.tone,
          topic: body.topic,
          hookType: h.type,
          score: h.score,
        })),
      });
      await prisma.user.update({
        where: { id: payload.sub },
        data: { hooksGenerated: { increment: hooks.length } },
      });
    }

    return { hooks, count: hooks.length };
  });

  app.get('/history', async (req, reply) => {
    const payload = req.user as { sub: string };
    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      platform: z.string().optional(),
      favorites: z.coerce.boolean().optional(),
    }).parse(req.query);

    const skip = (query.page - 1) * query.limit;
    const where: any = { userId: payload.sub };
    if (query.platform) where.platform = query.platform;
    if (query.favorites) where.isFavorite = true;

    const [items, total] = await Promise.all([
      prisma.generatedHook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.generatedHook.count({ where }),
    ]);

    return {
      items: items.map(h => ({
        id: h.id,
        text: h.content,
        type: h.hookType,
        score: h.score,
        platform: h.platform,
        isFavorite: h.isFavorite,
        niche: h.niche,
        tone: h.tone,
        topic: h.topic,
        createdAt: h.createdAt,
      })),
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  });

  app.post('/:id/favorite', async (req, reply) => {
    const payload = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const hook = await prisma.generatedHook.findFirst({
      where: { id, userId: payload.sub },
    });
    if (!hook) return reply.code(404).send({ error: 'Hook not found' });
    const updated = await prisma.generatedHook.update({
      where: { id },
      data: { isFavorite: !hook.isFavorite },
    });
    return updated;
  });

  app.delete('/:id', async (req, reply) => {
    const payload = req.user as { sub: string };
    const { id } = req.params as { id: string };
    await prisma.generatedHook.deleteMany({ where: { id, userId: payload.sub } });
    return reply.code(204).send();
  });

  app.get('/trending', async (req, reply) => {
    const payload = req.user as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const query = z.object({
      platform: z.string().optional(),
      niche: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(20).default(10),
    }).parse(req.query);

    // Free plan: cap at 5 trending hooks to create upgrade pressure
    const limit = user.plan === 'PRO' ? query.limit : Math.min(query.limit, 5);
    const effectiveNiche = user.plan === 'PRO' ? query.niche : undefined;

    // Cache per unique query combination — TTL 5 minutes
    const cacheKey = `trending:${user.plan}:${query.platform ?? '*'}:${effectiveNiche ?? '*'}:${limit}`;

    const result = await getCached(cacheKey, TRENDING_CACHE_TTL, async () => {
      const now = new Date();
      const where: any = { isActive: true, expiresAt: { gt: now } };
      if (query.platform) where.platform = query.platform;
      if (effectiveNiche) where.niche = effectiveNiche;

      const hooks = await prisma.trendingHook.findMany({
        where,
        orderBy: { score: 'desc' },
        take: limit,
        select: {
          id: true,
          text: true,
          platform: true,
          hookType: true,
          score: true,
          niche: true,
          sourceType: true,
          explanation: true,
          viewCount: true,
        },
      });

      return {
        hooks: hooks.map(h => ({
          ...h,
          viewCount: h.viewCount ? Number(h.viewCount) : null,
        })),
        total: hooks.length,
        planLimit: user.plan === 'FREE' ? 5 : null,
        isPro: user.plan === 'PRO',
      };
    });

    return result;
  });
}
