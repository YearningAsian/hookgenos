import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../index';
import { prisma } from '../lib/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    board: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    boardHook: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    apiKey: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_k: string, _t: number, fn: () => unknown) => fn()),
}));

describe('Board routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(prisma.board.findMany).mockResolvedValue([]);
    vi.mocked(prisma.board.count).mockResolvedValue(0);
    vi.mocked(prisma.board.create).mockResolvedValue({
      id: 'b1', name: 'Q3 teasers', color: '#9333ea', updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.board.findFirst).mockResolvedValue({ id: 'b1' } as never);
    vi.mocked(prisma.board.update).mockResolvedValue({} as never);
    vi.mocked(prisma.board.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.board.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.boardHook.create).mockResolvedValue({
      id: 'h1', text: 'Stop scrolling', hookType: 'pain_point', platform: 'tiktok',
      score: 92, niche: null, sourceHandle: null, sourceViews: null, createdAt: new Date(),
    } as never);
    vi.mocked(prisma.boardHook.deleteMany).mockResolvedValue({ count: 1 });

    app = await buildApp();
    token = app.jwt.sign({ sub: 'user-1', email: 'a@test.com' }, { expiresIn: '1h' });
  });

  const auth = { authorization: () => `Bearer ${token}` };

  // ── Auth guards ────────────────────────────────────────────────────────────
  it('GET /api/boards returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/boards' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/boards returns 401 without auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/boards', payload: { name: 'x' } });
    expect(res.statusCode).toBe(401);
  });

  // ── GET /api/boards ────────────────────────────────────────────────────────
  it('lists boards with hook count and preview', async () => {
    vi.mocked(prisma.board.findMany).mockResolvedValue([
      {
        id: 'b1', name: 'Q3 teasers', color: '#9333ea', updatedAt: new Date(),
        hooks: [{ text: 'Hook one' }, { text: 'Hook two' }],
        _count: { hooks: 2 },
      },
    ] as never);

    const res = await app.inject({ method: 'GET', url: '/api/boards', headers: { authorization: auth.authorization() } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.boards).toHaveLength(1);
    expect(body.boards[0].hookCount).toBe(2);
    expect(body.boards[0].preview).toEqual(['Hook one', 'Hook two']);
  });

  // ── POST /api/boards ───────────────────────────────────────────────────────
  it('creates a board', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/boards',
      headers: { authorization: auth.authorization() },
      payload: { name: 'Finance swipe file' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBe('b1');
    expect(body.hookCount).toBe(0);
    expect(body.preview).toEqual([]);
  });

  it('rejects an empty board name', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/boards',
      headers: { authorization: auth.authorization() },
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid color', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/boards',
      headers: { authorization: auth.authorization() },
      payload: { name: 'Test', color: 'purple' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 429 at the board limit', async () => {
    vi.mocked(prisma.board.count).mockResolvedValue(50);
    const res = await app.inject({
      method: 'POST', url: '/api/boards',
      headers: { authorization: auth.authorization() },
      payload: { name: 'Over limit' },
    });
    expect(res.statusCode).toBe(429);
  });

  // ── GET /api/boards/:id ────────────────────────────────────────────────────
  it('returns board detail with mapped hooks', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue({
      id: 'b1', name: 'Q3 teasers', color: '#9333ea', createdAt: new Date(), updatedAt: new Date(),
      hooks: [{
        id: 'h1', text: 'Stop scrolling', hookType: 'pain_point', platform: 'tiktok',
        score: 92, niche: 'Finance', sourceHandle: '@dana', sourceViews: '2.4M', createdAt: new Date(),
      }],
    } as never);

    const res = await app.inject({ method: 'GET', url: '/api/boards/b1', headers: { authorization: auth.authorization() } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.board.name).toBe('Q3 teasers');
    expect(body.hooks[0].type).toBe('pain_point');
    expect(body.hooks[0]).not.toHaveProperty('hookType');
  });

  it('returns 404 for a board the user does not own', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null);
    const res = await app.inject({ method: 'GET', url: '/api/boards/other', headers: { authorization: auth.authorization() } });
    expect(res.statusCode).toBe(404);
  });

  // ── PATCH /api/boards/:id ──────────────────────────────────────────────────
  it('renames a board', async () => {
    const res = await app.inject({
      method: 'PATCH', url: '/api/boards/b1',
      headers: { authorization: auth.authorization() },
      payload: { name: 'Renamed' },
    });
    expect(res.statusCode).toBe(204);
  });

  it('rejects an empty PATCH', async () => {
    const res = await app.inject({
      method: 'PATCH', url: '/api/boards/b1',
      headers: { authorization: auth.authorization() },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when patching a board the user does not own', async () => {
    vi.mocked(prisma.board.updateMany).mockResolvedValue({ count: 0 });
    const res = await app.inject({
      method: 'PATCH', url: '/api/boards/other',
      headers: { authorization: auth.authorization() },
      payload: { name: 'Renamed' },
    });
    expect(res.statusCode).toBe(404);
  });

  // ── DELETE /api/boards/:id ─────────────────────────────────────────────────
  it('deletes a board', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/boards/b1', headers: { authorization: auth.authorization() } });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 deleting a board the user does not own', async () => {
    vi.mocked(prisma.board.deleteMany).mockResolvedValue({ count: 0 });
    const res = await app.inject({ method: 'DELETE', url: '/api/boards/other', headers: { authorization: auth.authorization() } });
    expect(res.statusCode).toBe(404);
  });

  // ── POST /api/boards/:id/hooks ─────────────────────────────────────────────
  it('saves a hook into a board', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/boards/b1/hooks',
      headers: { authorization: auth.authorization() },
      payload: { text: 'Stop scrolling', hookType: 'pain_point', platform: 'tiktok', score: 92 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().type).toBe('pain_point');
    expect(prisma.board.update).toHaveBeenCalled();
  });

  it('rejects saving a hook with no text', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/boards/b1/hooks',
      headers: { authorization: auth.authorization() },
      payload: { text: '', hookType: 'pain_point', platform: 'tiktok' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 saving into a board the user does not own', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null);
    const res = await app.inject({
      method: 'POST', url: '/api/boards/other/hooks',
      headers: { authorization: auth.authorization() },
      payload: { text: 'x', hookType: 'curiosity', platform: 'tiktok', score: 80 },
    });
    expect(res.statusCode).toBe(404);
    expect(prisma.boardHook.create).not.toHaveBeenCalled();
  });

  // ── DELETE /api/boards/:id/hooks/:hookId ───────────────────────────────────
  it('removes a hook from a board', async () => {
    const res = await app.inject({
      method: 'DELETE', url: '/api/boards/b1/hooks/h1',
      headers: { authorization: auth.authorization() },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 removing a hook from a board the user does not own', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null);
    const res = await app.inject({
      method: 'DELETE', url: '/api/boards/other/hooks/h1',
      headers: { authorization: auth.authorization() },
    });
    expect(res.statusCode).toBe(404);
    expect(prisma.boardHook.deleteMany).not.toHaveBeenCalled();
  });
});
