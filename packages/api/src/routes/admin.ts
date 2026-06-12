import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateAdmin } from '../middleware/admin';
import { parseOr400 } from '../lib/validation';
import {
  bulkTrendingSchema,
  toggleActiveSchema,
  listTrendingQuerySchema,
} from './admin.schemas';

function defaultExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticateAdmin);

  // Bulk upsert trending hooks (idempotent by text+platform).
  app.post('/trending', async (req, reply) => {
    const parsed = parseOr400(bulkTrendingSchema, req.body, reply);
    if (!parsed) return reply;
    const { hooks } = parsed;

    const created = await prisma.$transaction(
      hooks.map((h) =>
        prisma.trendingHook.upsert({
          where: { text_platform: { text: h.text, platform: h.platform } } as never,
          update: {
            score: h.score,
            niche: h.niche ?? null,
            explanation: h.explanation ?? null,
            isActive: h.isActive,
            viewCount: h.viewCount ? BigInt(h.viewCount) : null,
            expiresAt: h.expiresAt ? new Date(h.expiresAt) : defaultExpiry(),
          },
          create: {
            text: h.text,
            platform: h.platform,
            hookType: h.hookType,
            score: h.score,
            niche: h.niche ?? null,
            sourceType: h.sourceType,
            viewCount: h.viewCount ? BigInt(h.viewCount) : null,
            explanation: h.explanation ?? null,
            isActive: h.isActive,
            expiresAt: h.expiresAt ? new Date(h.expiresAt) : defaultExpiry(),
          },
        }),
      ),
    );

    return reply.code(201).send({ count: created.length, ok: true });
  });

  // List all trending hooks with optional filters.
  app.get('/trending', async (req, reply) => {
    const query = parseOr400(listTrendingQuerySchema, req.query, reply);
    if (!query) return reply;

    const where = {
      ...(query.platform ? { platform: query.platform } : {}),
      ...(query.niche ? { niche: query.niche } : {}),
      ...(query.active !== undefined ? { isActive: query.active === 'true' } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.trendingHook.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.trendingHook.count({ where }),
    ]);

    return {
      items: items.map((h) => ({ ...h, viewCount: h.viewCount ? Number(h.viewCount) : null })),
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  });

  // Toggle isActive on a single hook.
  app.patch('/trending/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = parseOr400(toggleActiveSchema, req.body, reply);
    if (!body) return reply;
    try {
      const hook = await prisma.trendingHook.update({
        where: { id },
        data: { isActive: body.isActive },
      });
      return { ...hook, viewCount: hook.viewCount ? Number(hook.viewCount) : null };
    } catch {
      return reply.code(404).send({ error: 'Hook not found' });
    }
  });

  // Hard-delete a trending hook.
  app.delete('/trending/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await prisma.trendingHook.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Hook not found' });
    }
  });

  // Admin stats overview.
  app.get('/stats', async () => {
    const [users, hooks, trending, apiKeys] = await Promise.all([
      prisma.user.count(),
      prisma.generatedHook.count(),
      prisma.trendingHook.count({ where: { isActive: true } }),
      prisma.apiKey.count(),
    ]);
    return { users, generatedHooks: hooks, activeTrendingHooks: trending, apiKeys };
  });
}
