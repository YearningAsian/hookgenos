import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    trendingHook: {
      findMany: vi.fn(),
    },
  },
}));

// Bypass Redis cache so every test hits the fetcher directly
vi.mock('../../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
}));

import { buildApp } from '../../index';
import { prisma } from '../../lib/prisma';

const makeTrendingHook = (overrides = {}) => ({
  id: 'th-1',
  text: 'Why 95% of creators quit before they go viral',
  platform: 'tiktok',
  hookType: 'shocking_stat',
  score: 92,
  niche: null,
  sourceType: 'manual',
  explanation: 'High fear/FOMO score with concrete statistic',
  viewCount: BigInt(0),
  ...overrides,
});

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

describe('GET /api/hooks/trending', () => {
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
    vi.mocked(prisma.trendingHook.findMany).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => makeTrendingHook({ id: `th-${i + 1}` })) as never,
    );
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/hooks/trending' });
    expect(res.statusCode).toBe(401);
  });

  it('returns trending hooks for authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.hooks)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.isPro).toBe('boolean');
  });

  it('each hook has expected shape', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending',
      headers: { authorization: `Bearer ${token}` },
    });
    const hook = res.json().hooks[0];
    expect(typeof hook.id).toBe('string');
    expect(typeof hook.text).toBe('string');
    expect(typeof hook.platform).toBe('string');
    expect(typeof hook.score).toBe('number');
  });

  it('free plan is capped at 5 hooks', async () => {
    vi.mocked(prisma.trendingHook.findMany).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => makeTrendingHook({ id: `th-${i + 1}` })) as never,
    );
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending?limit=20',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    // The effective limit passed to Prisma should be capped at 5 for FREE
    const calls = vi.mocked(prisma.trendingHook.findMany).mock.calls;
    expect(calls[0][0]).toMatchObject({ take: 5 });
    expect(res.json().planLimit).toBe(5);
  });

  it('pro plan uses requested limit up to 20', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser('PRO') as never);
    vi.mocked(prisma.trendingHook.findMany).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => makeTrendingHook({ id: `th-${i + 1}` })) as never,
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending?limit=10',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const calls = vi.mocked(prisma.trendingHook.findMany).mock.calls;
    expect(calls[0][0]).toMatchObject({ take: 10 });
    expect(res.json().planLimit).toBeNull();
    expect(res.json().isPro).toBe(true);
  });

  it('returns 404 when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('filters by platform query param', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending?platform=linkedin',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const calls = vi.mocked(prisma.trendingHook.findMany).mock.calls;
    expect(calls[0][0]).toMatchObject({ where: expect.objectContaining({ platform: 'linkedin' }) });
  });

  it('converts BigInt viewCount to number in response', async () => {
    vi.mocked(prisma.trendingHook.findMany).mockResolvedValue([
      makeTrendingHook({ viewCount: BigInt(1_500_000) }),
    ] as never);

    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/trending',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const hook = res.json().hooks[0];
    // viewCount must be a safe JS number, not a BigInt string
    expect(typeof hook.viewCount).toBe('number');
    expect(hook.viewCount).toBe(1_500_000);
  });
});
