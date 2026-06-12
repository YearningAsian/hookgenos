import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendPasswordResetEmail } from '../lib/email';

const RATE_LIMIT = { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } };
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function passwordResetRoutes(app: FastifyInstance) {
  // Request a password reset email.
  // Always returns 200 to prevent user enumeration.
  app.post('/forgot-password', RATE_LIMIT, async (req) => {
    try {
      const { email } = z.object({ email: z.email() }).parse(req.body);
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Invalidate any existing tokens for this user.
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        const token = randomBytes(32).toString('hex');
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        });

        await sendPasswordResetEmail(email, token);
      }

      return { ok: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { ok: true }; // Still hide enumeration
      }
      throw err;
    }
  });

  // Consume a reset token and update the password.
  app.post('/reset-password', RATE_LIMIT, async (req, reply) => {
    try {
      const body = z
        .object({
          token: z.string().length(64),
          password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(72, 'Password must be at most 72 characters'),
        })
        .parse(req.body);

      const tokenHash = hashToken(body.token);
      const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

      if (!record || record.usedAt || record.expiresAt < new Date()) {
        return reply.code(400).send({ error: 'Reset link is invalid or has expired' });
      }

      const hashed = await bcrypt.hash(body.password, 12);

      await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hashed } }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      ]);

      return { ok: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: err.issues });
      }
      throw err;
    }
  });
}
