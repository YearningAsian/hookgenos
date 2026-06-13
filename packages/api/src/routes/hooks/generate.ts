import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { generateHooks } from '@hookgenos/core';
import { prisma } from '../../lib/prisma';
import { parseOr400 } from '../../lib/validation';

const generateSchema = z.object({
  topic: z.string().min(1).max(200),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'general']).default('general'),
  niche: z.string().max(100).optional(),
  tone: z.enum(['casual', 'professional', 'urgent', 'curious', 'bold']).default('casual'),
  count: z.number().int().min(1).max(10).default(5),
  useAI: z.boolean().default(false),
});

const FREE_DAILY_LIMIT = 10;

export async function generateHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = parseOr400(generateSchema, req.body, reply);
  if (!body) return reply;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [user, todayCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.sub } }),
    prisma.generatedHook.count({
      where: { userId: req.user.sub, createdAt: { gte: today } },
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
        userId: req.user.sub,
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
      where: { id: req.user.sub },
      data: { hooksGenerated: { increment: hooks.length } },
    });
  }

  return { hooks, count: hooks.length };
}
