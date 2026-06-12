import { createHash } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

function readApiKeyHeader(req: FastifyRequest): string | undefined {
  const raw = req.headers['x-api-key'];
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  // Accept either httpOnly cookie JWT or X-API-Key header (API key auth).
  if (readApiKeyHeader(req)) {
    return authenticateApiKey(req, reply);
  }
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function authenticateApiKey(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = readApiKeyHeader(req);
  if (!apiKey || !apiKey.startsWith('hk_live_')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  const hash = createHash('sha256').update(apiKey).digest('hex');
  const record = await prisma.apiKey.findUnique({ where: { keyHash: hash } });
  if (!record) return reply.code(401).send({ error: 'Unauthorized' });
  if (record.expiresAt && record.expiresAt < new Date()) {
    return reply.code(401).send({ error: 'API key expired' });
  }

  // Update lastUsed non-blocking — fire and forget.
  prisma.apiKey.update({ where: { id: record.id }, data: { lastUsed: new Date() } }).catch(() => {});

  // Attach user payload so downstream handlers can read req.user.sub.
  // email is not available for API key auth; routes only use sub.
  (req as FastifyRequest & { user: { sub: string; email: string } }).user = {
    sub: record.userId,
    email: '',
  };
}
