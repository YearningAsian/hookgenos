import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    generatedHook: {
      count: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
}));

import { buildApp } from '../../index';
import { prisma } from '../../lib/prisma';

const makeUser = (plan: 'FREE' | 'PRO' = 'FREE') => ({
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  plan,
  hooksGenerated: 0,
  passwordHash: 'hashed',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('POST /api/hooks/generate', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    token = app.jwt.sign({ sub: 'user-1', email: 'alice@example.com' }, { expiresIn: '1h' });
  });
  afterAll(() => app.close());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser() as never);
    vi.mocked(prisma.generatedHook.count).mockResolvedValue(0);
    vi.mocked(prisma.generatedHook.createMany).mockResolvedValue({ count: 5 });
    vi.mocked(prisma.user.update).mockResolvedValue(makeUser() as never);
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      payload: { topic: 'fitness' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for empty topic', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when topic exceeds 200 chars', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'a'.repeat(201) },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when count exceeds 10', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'fitness', count: 11 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('generates hooks for a valid request (defaults)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'morning routines' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.hooks)).toBe(true);
    expect(body.hooks.length).toBeGreaterThan(0);
    expect(typeof body.count).toBe('number');
    expect(body.count).toBe(body.hooks.length);
  });

  it('respects explicit count', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'sleep', count: 3 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().hooks).toHaveLength(3);
  });

  it('each hook has text, type, score, platform fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'fitness', platform: 'tiktok', tone: 'bold', count: 2 },
    });
    expect(res.statusCode).toBe(200);
    for (const h of res.json().hooks) {
      expect(typeof h.text).toBe('string');
      expect(h.text.length).toBeGreaterThan(0);
      expect(typeof h.type).toBe('string');
      expect(typeof h.score).toBe('number');
      expect(h.platform).toBe('tiktok');
    }
  });

  it('returns 429 when free plan daily limit (10) is reached', async () => {
    vi.mocked(prisma.generatedHook.count).mockResolvedValue(10);

    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'fitness' },
    });
    expect(res.statusCode).toBe(429);
    expect(res.json().limitReached).toBe(true);
  });

  it('pro plan bypasses daily limit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser('PRO') as never);
    vi.mocked(prisma.generatedHook.count).mockResolvedValue(50);

    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'fitness' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 when user is not found in DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { topic: 'fitness' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('accepts valid platform values', async () => {
    for (const platform of ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'general']) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/hooks/generate',
        headers: { authorization: `Bearer ${token}` },
        payload: { topic: 'business', platform, count: 1 },
      });
      expect(res.statusCode).toBe(200);
    }
  });

  it('accepts valid tone values', async () => {
    for (const tone of ['casual', 'professional', 'urgent', 'curious', 'bold']) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/hooks/generate',
        headers: { authorization: `Bearer ${token}` },
        payload: { topic: 'business', tone, count: 1 },
      });
      expect(res.statusCode).toBe(200);
    }
  });

  it('accepts JWT from cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/generate',
      cookies: { hg_auth: token },
      payload: { topic: 'fitness' },
    });
    expect(res.statusCode).toBe(200);
  });
});
