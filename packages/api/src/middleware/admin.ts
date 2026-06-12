import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Constant-time string comparison.
 *
 * `a !== b` short-circuits on the first differing byte and so leaks the length
 * of the matching prefix via timing — enough to brute-force a shared secret one
 * character at a time. Hashing both sides to a fixed length before comparing
 * with `timingSafeEqual` removes both the length-leak and the early-exit leak.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws if lengths differ; compare against a same-length
  // buffer and AND in the real length check so timing stays constant.
  if (bufA.length !== bufB.length) {
    // Still perform a comparison to keep timing independent of which branch.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function authenticateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers['x-admin-token'];
  const token = Array.isArray(header) ? header[0] : header;
  const adminToken = process.env.ADMIN_API_TOKEN;

  // Fail closed: if no admin token is configured, the admin surface is disabled.
  if (!adminToken || !token || !safeEqual(token, adminToken)) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
