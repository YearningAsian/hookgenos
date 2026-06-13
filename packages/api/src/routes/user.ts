import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { parseOr400 } from '../lib/validation';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
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
    const body = parseOr400(updateUserSchema, req.body, reply);
    if (!body) return reply;

    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: { name: body.name },
      select: { id: true, email: true, name: true, plan: true },
    });
    return user;
  });

  app.delete('/', async (req, reply) => {
    await prisma.generatedHook.deleteMany({ where: { userId: req.user.sub } });
    await prisma.user.delete({ where: { id: req.user.sub } });
    return reply.code(204).send();
  });
}
