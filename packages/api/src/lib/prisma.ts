import { PrismaClient, PrismaPg } from '@hookgenos/database';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prisma 7 is Rust-free and talks to Postgres through a driver adapter.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });

export const prisma =
  global.__prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
