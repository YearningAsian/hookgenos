import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../index';
import { prisma } from '../lib/prisma';
import { sendPasswordResetEmail } from '../lib/email';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    apiKey: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    trendingHook: { findMany: vi.fn(), count: vi.fn() },
    generatedHook: { count: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));
vi.mock('../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_k: string, _t: number, fn: () => unknown) => fn()),
}));
vi.mock('../lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Password reset routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({ id: 'tok-1' } as never);
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as never);
    vi.mocked(prisma.apiKey.count).mockResolvedValue(0);

    app = await buildApp();
  });

  // ── POST /api/auth/forgot-password ──────────────────────────────────────────
  it('returns 200 for any email (prevents enumeration)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: 'nobody@test.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('does not call email when user not found', async () => {
    await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: 'ghost@test.com' },
    });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends reset email when user exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1' } as never);

    await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: 'real@test.com' },
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('real@test.com', expect.any(String));
  });

  it('token passed to email is 64 hex characters', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1' } as never);

    await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: 'real@test.com' },
    });
    const [, token] = vi.mocked(sendPasswordResetEmail).mock.calls[0];
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns ok:true even for invalid email format (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('deletes existing tokens before creating a new one', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1' } as never);

    await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: 'real@test.com' },
    });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  // ── POST /api/auth/reset-password ───────────────────────────────────────────
  it('returns 400 for token not 64 chars', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'short', password: 'NewPass123!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when token not found in DB', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'a'.repeat(64), password: 'NewPass123!' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/invalid or has expired/i);
  });

  it('returns 400 when token already used', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'tok-1', userId: 'u1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 3_600_000),
    } as never);

    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'b'.repeat(64), password: 'NewPass123!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when token is expired', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'tok-1', userId: 'u1',
      usedAt: null,
      expiresAt: new Date('2000-01-01'),
    } as never);

    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'c'.repeat(64), password: 'NewPass123!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('resets password with valid token', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'tok-1', userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 3_600_000),
    } as never);

    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'd'.repeat(64), password: 'NewPass123!' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects password shorter than 8 chars', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'tok-1', userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 3_600_000),
    } as never);

    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'e'.repeat(64), password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects password longer than 72 chars', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/reset-password',
      payload: { token: 'f'.repeat(64), password: 'x'.repeat(73) },
    });
    expect(res.statusCode).toBe(400);
  });
});
