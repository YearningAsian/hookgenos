import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (req) => {
    const payload = req.user as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        hooksGenerated: true,
        createdAt: true,
      },
    });
    return user;
  });

  app.patch('/', async (req, reply) => {
    const payload = req.user as { sub: string };
    const body = z.object({
      name: z.string().min(1).max(100).optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: { name: body.name },
      select: { id: true, email: true, name: true, plan: true },
    });
    return user;
  });

  app.delete('/', async (req, reply) => {
    const payload = req.user as { sub: string };
    await prisma.generatedHook.deleteMany({ where: { userId: payload.sub } });
    await prisma.user.delete({ where: { id: payload.sub } });
    return reply.code(204).send();
  });
}
