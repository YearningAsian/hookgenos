import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@hookgenos/database';
import { prisma } from '../../lib/prisma';
import { getCached } from '../../lib/redis';

const TRENDING_CACHE_TTL = 300; // 5 minutes

const trendingQuerySchema = z.object({
  platform: z.string().optional(),
  niche: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export async function trendingHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return reply.code(404).send({ error: 'User not found' });

  const query = trendingQuerySchema.parse(req.query);

  // Free plan: cap at 5 trending hooks to create upgrade pressure
  const limit = user.plan === 'PRO' ? query.limit : Math.min(query.limit, 5);
  const effectiveNiche = user.plan === 'PRO' ? query.niche : undefined;

  // Cache per unique query combination — TTL 5 minutes
  const cacheKey = `trending:${user.plan}:${query.platform ?? '*'}:${effectiveNiche ?? '*'}:${limit}`;

  return getCached(cacheKey, TRENDING_CACHE_TTL, async () => {
    const now = new Date();
    const where: Prisma.TrendingHookWhereInput = { isActive: true, expiresAt: { gt: now } };
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
}
