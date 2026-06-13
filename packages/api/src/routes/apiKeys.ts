import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { parseOr400 } from '../lib/validation';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

function generateApiKey(): { key: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const key = `hk_live_${raw}`;
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, hash };
}

export async function apiKeyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // Create a new API key. The raw key is returned exactly once — it cannot
  // be retrieved again; only the SHA-256 hash is stored.
  app.post('/', async (req, reply) => {
    const body = parseOr400(createKeySchema, req.body, reply);
    if (!body) return reply;

    const existing = await prisma.apiKey.count({ where: { userId: req.user.sub } });
    if (existing >= 10) {
      return reply.code(429).send({ error: 'API key limit reached (max 10 per account)' });
    }

    const { key, hash } = generateApiKey();
    const expiresAt = body.expiresInDays
      ? new Date(Date.now() + body.expiresInDays * 86_400_000)
      : null;

    const record = await prisma.apiKey.create({
      data: {
        userId: req.user.sub,
        name: body.name,
        keyHash: hash,
        expiresAt,
      },
      select: { id: true, name: true, createdAt: true, expiresAt: true },
    });

    // Return the raw key in the creation response only.
    return reply.code(201).send({ ...record, key });
  });

  // List all API keys for the authenticated user (hashes never returned).
  app.get('/', async (req) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.sub },
      select: { id: true, name: true, lastUsed: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { keys };
  });

  // Revoke (delete) an API key by id.
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = await prisma.apiKey.deleteMany({
      where: { id, userId: req.user.sub },
    });
    if (deleted.count === 0) {
      return reply.code(404).send({ error: 'API key not found' });
    }
    return reply.code(204).send();
  });
}
