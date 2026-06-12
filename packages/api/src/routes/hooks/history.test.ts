import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    generatedHook: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
}));

import { buildApp } from '../../index';
import { prisma } from '../../lib/prisma';

const makeHook = (overrides = {}) => ({
  id: 'hook-1',
  userId: 'user-1',
  content: 'Stop scrolling if you want to improve your fitness',
  platform: 'tiktok',
  niche: null,
  tone: 'casual',
  topic: 'fitness',
  hookType: 'fear_fomo',
  score: 91,
  isFavorite: false,
  createdAt: new Date(),
  ...overrides,
});

describe('GET /api/hooks/history', () => {
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
    vi.mocked(prisma.generatedHook.findMany).mockResolvedValue([makeHook()] as never);
    vi.mocked(prisma.generatedHook.count).mockResolvedValue(1);
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/hooks/history' });
    expect(res.statusCode).toBe(401);
  });

  it('returns paginated history for authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/history',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(typeof body.pages).toBe('number');
  });

  it('each item has expected shape', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/history',
      headers: { authorization: `Bearer ${token}` },
    });
    const item = res.json().items[0];
    expect(typeof item.id).toBe('string');
    expect(typeof item.text).toBe('string');
    expect(typeof item.type).toBe('string');
    expect(typeof item.score).toBe('number');
    expect(typeof item.platform).toBe('string');
    expect(typeof item.isFavorite).toBe('boolean');
  });

  it('forwards platform filter to prisma', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/history?platform=linkedin',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const calls = vi.mocked(prisma.generatedHook.findMany).mock.calls;
    expect(calls[0][0]).toMatchObject({ where: { platform: 'linkedin' } });
  });

  it('forwards favorites filter to prisma', async () => {
    vi.mocked(prisma.generatedHook.findMany).mockResolvedValue([makeHook({ isFavorite: true })] as never);
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/history?favorites=true',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const calls = vi.mocked(prisma.generatedHook.findMany).mock.calls;
    expect(calls[0][0]).toMatchObject({ where: { isFavorite: true } });
  });

  it('applies pagination via page + limit', async () => {
    vi.mocked(prisma.generatedHook.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.generatedHook.count).mockResolvedValue(40);
    const res = await app.inject({
      method: 'GET',
      url: '/api/hooks/history?page=2&limit=10',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.page).toBe(2);
    expect(body.pages).toBe(4);
    const calls = vi.mocked(prisma.generatedHook.findMany).mock.calls;
    expect(calls[0][0]).toMatchObject({ skip: 10, take: 10 });
  });
});

describe('POST /api/hooks/:id/favorite', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    token = app.jwt.sign({ sub: 'user-1', email: 'alice@example.com' }, { expiresIn: '1h' });
  });
  afterAll(() => app.close());
  beforeEach(() => vi.clearAllMocks());

  it('toggles isFavorite and returns updated hook', async () => {
    vi.mocked(prisma.generatedHook.findFirst).mockResolvedValue(makeHook({ isFavorite: false }) as never);
    vi.mocked(prisma.generatedHook.update).mockResolvedValue(makeHook({ isFavorite: true }) as never);

    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/hook-1/favorite',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(vi.mocked(prisma.generatedHook.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isFavorite: true } }),
    );
  });

  it('returns 404 when hook does not belong to user', async () => {
    vi.mocked(prisma.generatedHook.findFirst).mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: '/api/hooks/hook-99/favorite',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/hooks/hook-1/favorite' });
    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/hooks/:id', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    token = app.jwt.sign({ sub: 'user-1', email: 'alice@example.com' }, { expiresIn: '1h' });
  });
  afterAll(() => app.close());
  beforeEach(() => vi.clearAllMocks());

  it('deletes hook and returns 204', async () => {
    vi.mocked(prisma.generatedHook.deleteMany).mockResolvedValue({ count: 1 });

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/hooks/hook-1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
    expect(vi.mocked(prisma.generatedHook.deleteMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'hook-1', userId: 'user-1' } }),
    );
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/hooks/hook-1' });
    expect(res.statusCode).toBe(401);
  });
});
