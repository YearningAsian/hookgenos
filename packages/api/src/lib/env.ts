// Side-effect module: load .env before any other module reads process.env.
// Imported first in index.ts — import ordering guarantees this runs early.
import { config } from 'dotenv';
import { resolve } from 'path';

// Try package-local .env first; fall back to monorepo root (4 levels up from dist/lib or src/lib).
config({ quiet: true });
config({ path: resolve(__dirname, '../../../../.env'), quiet: true, override: false });

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Validate security-critical configuration at startup.
 *
 * Returns a list of fatal problems. In production any fatal problem should
 * abort boot (see buildApp). In development we only warn so contributors can
 * run the app without a fully-provisioned secret store.
 *
 * Kept as a pure function (no process.exit / no logging) so it is unit-testable.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const errors: string[] = [];
  const isProd = env.NODE_ENV === 'production';

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is not set.');
  } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET is too short (${jwtSecret.length} chars); use at least ${MIN_JWT_SECRET_LENGTH} ` +
        '(generate with `openssl rand -hex 32`).',
    );
  } else if (jwtSecret === 'dev-secret-CHANGE-IN-PRODUCTION') {
    errors.push('JWT_SECRET is still set to the insecure development placeholder.');
  }

  // If Stripe is configured for billing, a webhook secret is mandatory —
  // without it the webhook endpoint cannot verify signatures and would have
  // to be left open, so refuse the half-configured state.
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing — webhooks cannot be verified.');
  }

  // Admin routes must never be reachable with an empty/weak shared token.
  if (isProd && env.ADMIN_API_TOKEN && env.ADMIN_API_TOKEN.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(`ADMIN_API_TOKEN is too short; use at least ${MIN_JWT_SECRET_LENGTH} chars.`);
  }

  return errors;
}
