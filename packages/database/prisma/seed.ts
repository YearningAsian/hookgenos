import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

/**
 * Resolve the demo user's password.
 *
 * The static `password123` default is convenient for local dev but must never
 * be planted in a production database. Outside of development we require an
 * explicit `SEED_DEMO_PASSWORD`, or otherwise generate a strong random one and
 * print it once so the operator can use it. The static dev default is only ever
 * used when NODE_ENV is not "production".
 */
export function resolveDemoPassword(
  env: { NODE_ENV?: string; SEED_DEMO_PASSWORD?: string } = process.env,
): { password: string; generated: boolean } {
  if (env.SEED_DEMO_PASSWORD) {
    return { password: env.SEED_DEMO_PASSWORD, generated: false };
  }
  if (env.NODE_ENV === 'production') {
    // No static fallback in production — generate a strong random password.
    return { password: randomBytes(18).toString('base64url'), generated: true };
  }
  return { password: 'password123', generated: false };
}

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const { password, generated } = resolveDemoPassword();
  if (generated) {
    console.log(`Generated demo password (save this — shown once): ${password}`);
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@hookgenos.com' },
    update: {},
    create: {
      email: 'demo@hookgenos.com',
      passwordHash: hashed,
      name: 'Demo User',
      plan: 'FREE',
    },
  });

  console.log(`Created demo user: ${user.email}`);

  // Seed some example hooks
  await prisma.generatedHook.createMany({
    data: [
      {
        userId: user.id,
        content: 'Stop scrolling — this is the business advice I wish I had at 25',
        platform: 'tiktok',
        tone: 'urgent',
        topic: 'entrepreneurship',
        hookType: 'fear_fomo',
        score: 91,
        isFavorite: true,
      },
      {
        userId: user.id,
        content: 'The one thing nobody tells you about building a personal brand',
        platform: 'instagram',
        tone: 'curious',
        topic: 'personal branding',
        hookType: 'curiosity',
        score: 88,
      },
      {
        userId: user.id,
        content: 'Unpopular opinion: hustle culture is destroying your creativity',
        platform: 'twitter',
        tone: 'bold',
        topic: 'productivity',
        hookType: 'contrarian',
        score: 93,
        isFavorite: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeded example hooks');
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
