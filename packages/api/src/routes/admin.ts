import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateAdmin } from '../middleware/admin';

const trendingHookSchema = z.object({
  text: z.string().min(1).max(500),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'linkedin', 'twitter', 'reddit']),
  hookType: z.string().min(1),
  score: z.number().int().min(0).max(100).default(80),
  niche: z.string().max(100).optional(),
  sourceType: z.enum(['youtube', 'reddit', 'twitter', 'manual']).default('manual'),
  viewCount: z.number().optional(),
  explanation: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

const bulkSchema = z.object({
  hooks: z.array(trendingHookSchema).min(1).max(200),
});

function defaultExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticateAdmin);

  // Bulk upsert trending hooks (idempotent by text+platform).
  app.post('/trending', async (req, reply) => {
    try {
      const { hooks } = bulkSchema.parse(req.body);

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
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: err.issues });
      }
      throw err;
    }
  });

  // List all trending hooks with optional filters.
  app.get('/trending', async (req) => {
    const query = req.query as { platform?: string; niche?: string; active?: string; limit?: string; page?: string };
    const limit = Math.min(parseInt(query.limit || '50', 10), 200);
    const page = Math.max(parseInt(query.page || '1', 10), 1);

    const where = {
      ...(query.platform ? { platform: query.platform } : {}),
      ...(query.niche ? { niche: query.niche } : {}),
      ...(query.active !== undefined ? { isActive: query.active === 'true' } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.trendingHook.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trendingHook.count({ where }),
    ]);

    return {
      items: items.map((h) => ({ ...h, viewCount: h.viewCount ? Number(h.viewCount) : null })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  });

  // Toggle isActive on a single hook.
  app.patch('/trending/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({ isActive: z.boolean() }).parse(req.body);
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
