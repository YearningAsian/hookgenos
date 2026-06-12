import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { generateHandler } from './generate';
import { historyHandler, favoriteHandler, deleteHandler } from './history';
import { trendingHandler } from './trending';

export async function hooksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/generate', generateHandler);
  app.get('/history', historyHandler);
  app.post('/:id/favorite', favoriteHandler);
  app.delete('/:id', deleteHandler);
  app.get('/trending', trendingHandler);
}
