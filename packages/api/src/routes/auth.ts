import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { parseOr400 } from '../lib/validation';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Tight rate limits for auth endpoints to prevent brute-force and enumeration
const AUTH_RATE_LIMIT = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', AUTH_RATE_LIMIT, async (req, reply) => {
    const body = parseOr400(registerSchema, req.body, reply);
    if (!body) return reply;

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.code(409).send({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hashed,
        name: body.name ?? null,
      },
      select: { id: true, email: true, name: true, plan: true, createdAt: true },
    });
    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });
    reply.setCookie('hg_auth', token, COOKIE_OPTS);
    return reply.code(201).send({ user });
  });

  app.post('/login', AUTH_RATE_LIMIT, async (req, reply) => {
    const body = parseOr400(loginSchema, req.body, reply);
    if (!body) return reply;

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });
    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });
    reply.setCookie('hg_auth', token, COOKIE_OPTS);
    return {
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    };
  });

  app.post('/logout', async (req, reply) => {
    reply.clearCookie('hg_auth', { path: '/' });
    return reply.code(204).send();
  });

  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, name: true, plan: true, createdAt: true, hooksGenerated: true },
    });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    return user;
  });
}
