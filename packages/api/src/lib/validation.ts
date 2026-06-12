import { z } from 'zod';
import type { FastifyReply } from 'fastify';

/**
 * Shared validation helpers.
 *
 * Every route boundary in this API validates input with zod and returns the
 * same 400 shape on failure. These helpers remove the repeated
 * `try { schema.parse() } catch (ZodError) { 400 } ` boilerplate that was
 * duplicated across auth / admin / apiKeys / passwordReset / hooks routes.
 */

export const ZOD_ERROR = 'Validation error';

/** Send the canonical 400 validation-error response. */
export function sendValidationError(reply: FastifyReply, err: z.ZodError) {
  return reply.code(400).send({ error: ZOD_ERROR, details: err.issues });
}

/** Type guard for zod errors thrown out of `.parse()`. */
export function isZodError(err: unknown): err is z.ZodError {
  return err instanceof z.ZodError;
}

/**
 * Parse `data` with `schema`. On success returns the typed value; on a zod
 * validation failure sends the 400 response and returns `undefined` so the
 * caller can early-return. Non-zod errors are rethrown for the global handler.
 */
export function parseOr400<T>(
  schema: z.ZodType<T>,
  data: unknown,
  reply: FastifyReply,
): T | undefined {
  const result = schema.safeParse(data);
  if (!result.success) {
    sendValidationError(reply, result.error);
    return undefined;
  }
  return result.data;
}
