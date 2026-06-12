import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

// Mock prisma before any imports that depend on it
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Prevent Redis connection in tests
vi.mock('../lib/redis', () => ({
  redis: null,
  getCached: vi.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
}));

import { buildApp } from '../index';
import { prisma } from '../lib/prisma';

const HASHED_PW = bcrypt.hashSync('password123', 4); // 4 rounds for speed

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  passwordHash: HASHED_PW,
  plan: 'FREE' as const,
  hooksGenerated: 0,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('POST /api/auth/register', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });
  afterAll(() => app.close());
  beforeEach(() => vi.clearAllMocks());

  it('registers a new user and sets httpOnly cookie', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
      plan: 'FREE',
      createdAt: new Date(),
    } as never);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('alice@example.com');
    // Token must NOT appear in the body
    expect(body.token).toBeUndefined();
    // httpOnly cookie must be present
    const setCookie = res.headers['set-cookie'] as string;
    expect(setCookie).toContain('hg_auth=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('returns 409 when email is already registered', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser());

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('Email already registered');
  });

  it('returns 400 on missing email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a malformed email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when password exceeds the 72-character bcrypt limit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'a'.repeat(73) },
    });
    expect(res.statusCode).toBe(400);
  });

  it('accepts a password exactly at the 72-character limit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: null,
      plan: 'FREE',
      createdAt: new Date(),
    } as never);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'a'.repeat(72) },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 when name exceeds 100 characters', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'a'.repeat(101) },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when name is an empty string', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('omits the name when not provided (optional)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      email: 'noname@example.com',
      name: null,
      plan: 'FREE',
      createdAt: new Date(),
    } as never);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'noname@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(201);
    // create should be called with name coerced to null
    const createArg = vi.mocked(prisma.user.create).mock.calls[0][0];
    expect(createArg.data.name).toBeNull();
  });
});

describe('POST /api/auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });
  afterAll(() => app.close());
  beforeEach(() => vi.clearAllMocks());

  it('logs in with correct credentials and sets httpOnly cookie', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser());

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe('alice@example.com');
    expect(body.token).toBeUndefined();
    const setCookie = res.headers['set-cookie'] as string;
    expect(setCookie).toContain('hg_auth=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('returns 401 for unknown email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser());

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@example.com', password: 'wrongpassword' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for a malformed login email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nope', password: 'whatever' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when login password is empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@example.com', password: '' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });
  afterAll(() => app.close());

  it('clears the auth cookie and returns 204', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(204);
    // Cookie should be cleared (expires in the past / empty value)
    const setCookie = res.headers['set-cookie'] as string;
    expect(setCookie).toBeDefined();
  });
});

describe('GET /api/auth/me', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    token = app.jwt.sign({ sub: 'user-1', email: 'alice@example.com' }, { expiresIn: '1h' });
  });
  afterAll(() => app.close());
  beforeEach(() => vi.clearAllMocks());

  it('returns user data for authenticated request', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
      plan: 'FREE',
      createdAt: new Date(),
      hooksGenerated: 3,
    } as never);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe('alice@example.com');
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer bad.token.value' },
    });
    expect(res.statusCode).toBe(401);
  });
});
