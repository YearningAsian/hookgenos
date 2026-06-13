import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { parseOr400 } from '../lib/validation';

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_BOARDS = 50;

const createBoardSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(HEX).optional(),
});

const patchBoardSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    color: z.string().regex(HEX).optional(),
  })
  .refine((v) => v.name !== undefined || v.color !== undefined, {
    message: 'Nothing to update',
  });

const addHookSchema = z.object({
  text: z.string().min(1).max(400),
  hookType: z.string().min(1).max(40),
  platform: z.string().min(1).max(40),
  score: z.number().int().min(0).max(100).default(0),
  niche: z.string().max(60).optional(),
  sourceHandle: z.string().max(80).optional(),
  sourceViews: z.string().max(20).optional(),
});

interface BoardHookRow {
  id: string;
  text: string;
  hookType: string;
  platform: string;
  score: number;
  niche: string | null;
  sourceHandle: string | null;
  sourceViews: string | null;
  createdAt: Date;
}

function mapHook(h: BoardHookRow) {
  return {
    id: h.id,
    text: h.text,
    type: h.hookType,
    platform: h.platform,
    score: h.score,
    niche: h.niche,
    sourceHandle: h.sourceHandle,
    sourceViews: h.sourceViews,
    createdAt: h.createdAt,
  };
}

export async function boardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // List the user's boards with a hook count and a short text preview.
  app.get('/', async (req) => {
    const boards = await prisma.board.findMany({
      where: { userId: req.user.sub },
      orderBy: { updatedAt: 'desc' },
      include: {
        hooks: { select: { text: true }, orderBy: { createdAt: 'desc' }, take: 3 },
        _count: { select: { hooks: true } },
      },
    });
    return {
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        color: b.color,
        hookCount: b._count.hooks,
        preview: b.hooks.map((h) => h.text),
        updatedAt: b.updatedAt,
      })),
    };
  });

  // Create a new board.
  app.post('/', async (req, reply) => {
    const body = parseOr400(createBoardSchema, req.body, reply);
    if (!body) return reply;

    const count = await prisma.board.count({ where: { userId: req.user.sub } });
    if (count >= MAX_BOARDS) {
      return reply.code(429).send({ error: `Board limit reached (max ${MAX_BOARDS})` });
    }

    const board = await prisma.board.create({
      data: { userId: req.user.sub, name: body.name, color: body.color ?? '#9333ea' },
      select: { id: true, name: true, color: true, updatedAt: true },
    });
    return reply.code(201).send({ ...board, hookCount: 0, preview: [] });
  });

  // Board detail with all saved hooks.
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const board = await prisma.board.findFirst({
      where: { id, userId: req.user.sub },
      include: { hooks: { orderBy: { createdAt: 'desc' } } },
    });
    if (!board) return reply.code(404).send({ error: 'Board not found' });
    return {
      board: {
        id: board.id,
        name: board.name,
        color: board.color,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
      hooks: board.hooks.map(mapHook),
    };
  });

  // Rename / recolor a board.
  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = parseOr400(patchBoardSchema, req.body, reply);
    if (!body) return reply;

    const updated = await prisma.board.updateMany({
      where: { id, userId: req.user.sub },
      data: { ...(body.name !== undefined ? { name: body.name } : {}), ...(body.color !== undefined ? { color: body.color } : {}) },
    });
    if (updated.count === 0) return reply.code(404).send({ error: 'Board not found' });
    return reply.code(204).send();
  });

  // Delete a board (cascades its hooks).
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = await prisma.board.deleteMany({ where: { id, userId: req.user.sub } });
    if (deleted.count === 0) return reply.code(404).send({ error: 'Board not found' });
    return reply.code(204).send();
  });

  // Save a hook snapshot into a board.
  app.post('/:id/hooks', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = parseOr400(addHookSchema, req.body, reply);
    if (!body) return reply;

    // Ownership check before any write — prevents saving into someone else's board.
    const board = await prisma.board.findFirst({ where: { id, userId: req.user.sub }, select: { id: true } });
    if (!board) return reply.code(404).send({ error: 'Board not found' });

    const hook = await prisma.boardHook.create({
      data: {
        boardId: id,
        text: body.text,
        hookType: body.hookType,
        platform: body.platform,
        score: body.score,
        niche: body.niche ?? null,
        sourceHandle: body.sourceHandle ?? null,
        sourceViews: body.sourceViews ?? null,
      },
    });
    // Bump the board's updatedAt so "recently used" ordering reflects the save.
    await prisma.board.update({ where: { id }, data: { updatedAt: new Date() } });
    return reply.code(201).send(mapHook(hook));
  });

  // Remove a hook from a board.
  app.delete('/:id/hooks/:hookId', async (req, reply) => {
    const { id, hookId } = req.params as { id: string; hookId: string };
    const board = await prisma.board.findFirst({ where: { id, userId: req.user.sub }, select: { id: true } });
    if (!board) return reply.code(404).send({ error: 'Board not found' });

    const deleted = await prisma.boardHook.deleteMany({ where: { id: hookId, boardId: id } });
    if (deleted.count === 0) return reply.code(404).send({ error: 'Hook not found' });
    return reply.code(204).send();
  });
}
