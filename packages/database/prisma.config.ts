// Prisma 7 CLI configuration. The CLI no longer reads .env files on its own,
// so dotenv must be loaded here for DATABASE_URL to be available to Migrate.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Used by migration/introspection commands; the runtime client gets its
  // connection from the PrismaPg adapter instead.
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
});
