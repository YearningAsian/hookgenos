import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../index';
import { prisma } from '../lib/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    apiKey: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    trendingHook: { findMany: vi.fn(), count: vi.fn() },
    user: { count: vi.fn() },
    generatedHook: { count: vi.fn() },
  },
}));
vi.mock('../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_k: string, _t: number, fn: () => unknown) => fn()),
}));

describe('API key routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
    vi.mocked(prisma.apiKey.create).mockResolvedValue({
      id: 'key-1', name: 'My key', createdAt: new Date(), expiresAt: null,
    } as never);
    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([]);
    vi.mocked(prisma.apiKey.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as never);

    app = await buildApp();
    token = app.jwt.sign({ sub: 'user-1', email: 'a@test.com' }, { expiresIn: '1h' });
  });

  // ── Auth guards ─────────────────────────────────────────────────────────────
  it('POST /api/api-keys returns 401 without auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/api-keys', payload: { name: 'test' } });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/api-keys returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/api-keys' });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/api-keys/:id returns 401 without auth', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/api-keys/key-1' });
    expect(res.statusCode).toBe(401);
  });

  // ── POST /api/api-keys ──────────────────────────────────────────────────────
  it('creates an API key and returns the raw key once', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'CI key' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.key).toMatch(/^hk_live_[0-9a-f]{64}$/);
    expect(body.name).toBe('My key');
    expect(body).not.toHaveProperty('keyHash');
  });

  it('rejects empty name', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects name longer than 100 chars', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'a'.repeat(101) },
    });
    expect(res.statusCode).toBe(400);
  });

  it('accepts optional expiresInDays', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Expiring key', expiresInDays: 30 },
    });
    expect(res.statusCode).toBe(201);
  });

  it('rejects expiresInDays > 365', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Too long', expiresInDays: 366 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 429 when user has 10 existing keys', async () => {
    vi.mocked(prisma.apiKey.count).mockResolvedValue(10);

    const res = await app.inject({
      method: 'POST', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Over limit' },
    });
    expect(res.statusCode).toBe(429);
  });

  // ── GET /api/api-keys ───────────────────────────────────────────────────────
  it('lists keys without exposing hashes', async () => {
    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
      { id: 'k1', name: 'Key 1', lastUsed: null, expiresAt: null, createdAt: new Date() } as never,
    ]);

    const res = await app.inject({
      method: 'GET', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.keys).toHaveLength(1);
    expect(body.keys[0]).not.toHaveProperty('keyHash');
  });

  it('returns empty array when user has no keys', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/api-keys',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().keys).toEqual([]);
  });

  // ── DELETE /api/api-keys/:id ────────────────────────────────────────────────
  it('revokes an API key', async () => {
    const res = await app.inject({
      method: 'DELETE', url: '/api/api-keys/key-1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 when key does not belong to user', async () => {
    vi.mocked(prisma.apiKey.deleteMany).mockResolvedValue({ count: 0 });

    const res = await app.inject({
      method: 'DELETE', url: '/api/api-keys/other-key',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  // ── API key header auth ──────────────────────────────────────────────────────
  it('accepts X-API-Key header for authentication', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: 'key-1', userId: 'user-1', expiresAt: null,
    } as never);
    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([]);

    const fakeKey = 'hk_live_' + 'a'.repeat(64);
    const res = await app.inject({
      method: 'GET', url: '/api/api-keys',
      headers: { 'x-api-key': fakeKey },
    });
    expect(res.statusCode).toBe(200);
  });

  it('rejects X-API-Key with wrong prefix', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/api-keys',
      headers: { 'x-api-key': 'sk_live_bad' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects expired API key', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: 'key-1', userId: 'user-1', expiresAt: new Date('2000-01-01'),
    } as never);

    const fakeKey = 'hk_live_' + 'b'.repeat(64);
    const res = await app.inject({
      method: 'GET', url: '/api/api-keys',
      headers: { 'x-api-key': fakeKey },
    });
    expect(res.statusCode).toBe(401);
  });
});
