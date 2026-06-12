import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers['x-admin-token'];
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken || token !== adminToken) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
