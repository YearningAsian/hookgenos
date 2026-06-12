import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import rawBody from '@fastify/rawbody';
import { authRoutes } from './routes/auth';
import { hooksRoutes } from './routes/hooks';
import { billingRoutes } from './routes/billing';
import { userRoutes } from './routes/user';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

async function start() {
  // Must be registered before content type parsers / routes
  await app.register(rawBody, { runFirst: true });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET is not set in production. Refusing to start.');
      process.exit(1);
    }
    console.warn('WARNING: JWT_SECRET not set — using insecure dev default. Set JWT_SECRET before deploying.');
  }
  await app.register(jwt, {
    secret: jwtSecret || 'dev-secret-CHANGE-IN-PRODUCTION',
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(hooksRoutes, { prefix: '/api/hooks' });
  await app.register(billingRoutes, { prefix: '/api/billing' });
  await app.register(userRoutes, { prefix: '/api/user' });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
