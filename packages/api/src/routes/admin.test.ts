import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../index';
import { prisma } from '../lib/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    trendingHook: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    generatedHook: { count: vi.fn() },
    user: { count: vi.fn() },
    apiKey: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_k: string, _t: number, fn: () => unknown) => fn()),
}));

const ADMIN_TOKEN = 'test-admin-token-123';

function makeHook(overrides = {}) {
  return {
    text: 'Stop scrolling — you need to hear this',
    platform: 'tiktok',
    hookType: 'curiosity',
    score: 88,
    sourceType: 'manual',
    ...overrides,
  };
}

describe('Admin routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    process.env.ADMIN_API_TOKEN = ADMIN_TOKEN;
    vi.clearAllMocks();

    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 'h1', viewCount: null }]);
    vi.mocked(prisma.trendingHook.findMany).mockResolvedValue([]);
    vi.mocked(prisma.trendingHook.count).mockResolvedValue(0);
    vi.mocked(prisma.user.count).mockResolvedValue(5);
    vi.mocked(prisma.generatedHook.count).mockResolvedValue(20);
    vi.mocked(prisma.apiKey.count).mockResolvedValue(3);

    app = await buildApp();
  });

  // ── Authentication ──────────────────────────────────────────────────────────
  it('rejects requests with no admin token', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/trending', payload: { hooks: [makeHook()] } });
    expect(res.statusCode).toBe(401);
  });

  it('rejects requests with wrong admin token', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/trending',
      headers: { 'x-admin-token': 'wrong' },
      payload: { hooks: [makeHook()] },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects a token that is a prefix of the real token (constant-time)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/trending',
      headers: { 'x-admin-token': ADMIN_TOKEN.slice(0, ADMIN_TOKEN.length - 1) },
      payload: { hooks: [makeHook()] },
    });
    expect(res.statusCode).toBe(401);
  });

  it('fails closed when no admin token is configured on the server', async () => {
    const saved = process.env.ADMIN_API_TOKEN;
    delete process.env.ADMIN_API_TOKEN;
    try {
      const res = await app.inject({
        method: 'POST', url: '/admin/trending',
        headers: { 'x-admin-token': 'anything' },
        payload: { hooks: [makeHook()] },
      });
      expect(res.statusCode).toBe(401);
    } finally {
      process.env.ADMIN_API_TOKEN = saved;
    }
  });

  // ── POST /admin/trending ────────────────────────────────────────────────────
  it('creates trending hooks with valid payload', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/trending',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      payload: { hooks: [makeHook()] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ count: 1, ok: true });
  });

  it('rejects empty hooks array', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/trending',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      payload: { hooks: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid platform', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/trending',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      payload: { hooks: [makeHook({ platform: 'snapchat' })] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('accepts optional niche and explanation fields', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/trending',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      payload: { hooks: [makeHook({ niche: 'fitness', explanation: 'High share rate on fitness content' })] },
    });
    expect(res.statusCode).toBe(201);
  });

  // ── GET /admin/trending ─────────────────────────────────────────────────────
  it('lists trending hooks and serializes BigInt viewCount', async () => {
    vi.mocked(prisma.trendingHook.findMany).mockResolvedValue([
      { id: 'h1', text: 'Hook text', platform: 'tiktok', hookType: 'curiosity', score: 88, viewCount: BigInt(1000), isActive: true } as never,
    ]);
    vi.mocked(prisma.trendingHook.count).mockResolvedValue(1);

    const res = await app.inject({
      method: 'GET', url: '/admin/trending',
      headers: { 'x-admin-token': ADMIN_TOKEN },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].viewCount).toBe(1000);
  });

  // ── PATCH /admin/trending/:id ───────────────────────────────────────────────
  it('toggles isActive on a trending hook', async () => {
    vi.mocked(prisma.trendingHook.update).mockResolvedValue({ id: 'h1', isActive: false, viewCount: null } as never);

    const res = await app.inject({
      method: 'PATCH', url: '/admin/trending/h1',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      payload: { isActive: false },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().isActive).toBe(false);
  });

  it('returns 404 when toggling a non-existent hook', async () => {
    vi.mocked(prisma.trendingHook.update).mockRejectedValue(new Error('Not found'));

    const res = await app.inject({
      method: 'PATCH', url: '/admin/trending/missing',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      payload: { isActive: false },
    });
    expect(res.statusCode).toBe(404);
  });

  // ── DELETE /admin/trending/:id ──────────────────────────────────────────────
  it('deletes a trending hook', async () => {
    vi.mocked(prisma.trendingHook.delete).mockResolvedValue({} as never);

    const res = await app.inject({
      method: 'DELETE', url: '/admin/trending/h1',
      headers: { 'x-admin-token': ADMIN_TOKEN },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 when deleting a non-existent hook', async () => {
    vi.mocked(prisma.trendingHook.delete).mockRejectedValue(new Error('Not found'));

    const res = await app.inject({
      method: 'DELETE', url: '/admin/trending/missing',
      headers: { 'x-admin-token': ADMIN_TOKEN },
    });
    expect(res.statusCode).toBe(404);
  });

  // ── GET /admin/stats ────────────────────────────────────────────────────────
  it('returns stats overview', async () => {
    const res = await app.inject({
      method: 'GET', url: '/admin/stats',
      headers: { 'x-admin-token': ADMIN_TOKEN },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      users: 5,
      generatedHooks: 20,
      activeTrendingHooks: 0,
      apiKeys: 3,
    });
  });
});
