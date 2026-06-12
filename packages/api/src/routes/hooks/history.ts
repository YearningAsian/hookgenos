import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@hookgenos/database';
import { prisma } from '../../lib/prisma';

const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  platform: z.string().optional(),
  favorites: z.coerce.boolean().optional(),
});

export async function historyHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = historyQuerySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.GeneratedHookWhereInput = { userId: req.user.sub };
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
}

export async function favoriteHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const hook = await prisma.generatedHook.findFirst({
    where: { id, userId: req.user.sub },
  });
  if (!hook) return reply.code(404).send({ error: 'Hook not found' });
  return prisma.generatedHook.update({
    where: { id },
    data: { isFavorite: !hook.isFavorite },
  });
}

export async function deleteHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  await prisma.generatedHook.deleteMany({ where: { id, userId: req.user.sub } });
  return reply.code(204).send();
}
