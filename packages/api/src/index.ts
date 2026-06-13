import { validateEnv } from './lib/env';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import rawBody from 'fastify-raw-body';
import { authRoutes } from './routes/auth';
import { hooksRoutes } from './routes/hooks';
import { billingRoutes } from './routes/billing';
import { userRoutes } from './routes/user';
import { adminRoutes } from './routes/admin';
import { apiKeyRoutes } from './routes/apiKeys';
import { passwordResetRoutes } from './routes/passwordReset';

export async function buildApp(): Promise<FastifyInstance> {
  // Validate security-critical configuration before doing anything else.
  // In production a misconfiguration is fatal; in dev we only warn.
  const envErrors = validateEnv();
  if (envErrors.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: insecure configuration. Refusing to start:');
      for (const e of envErrors) console.error(`  - ${e}`);
      process.exit(1);
    }
    for (const e of envErrors) {
      console.warn(`WARNING: ${e} (would be fatal in production)`);
    }
  }

  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  // Must be registered before content type parsers / routes.
  // global:false — only routes that opt in via `config: { rawBody: true }` pay the cost.
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: false,
    runFirst: true,
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Cookie plugin must be registered before JWT so jwt can read cookies.
  await app.register(cookie);

  // In production validateEnv() above guarantees a strong JWT_SECRET; the
  // dev-only default keeps local boot working without a provisioned secret.
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-CHANGE-IN-PRODUCTION';
  await app.register(jwt, {
    secret: jwtSecret,
    cookie: {
      cookieName: 'hg_auth',
      signed: false,
    },
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(passwordResetRoutes, { prefix: '/api/auth' });
  await app.register(hooksRoutes, { prefix: '/api/hooks' });
  await app.register(billingRoutes, { prefix: '/api/billing' });
  await app.register(userRoutes, { prefix: '/api/user' });
  await app.register(apiKeyRoutes, { prefix: '/api/api-keys' });
  await app.register(adminRoutes, { prefix: '/admin' });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  return app;
}

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
}

// Only start listening when this file is the process entry point.
// When imported by tests or other modules, skip the listen call.
if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
