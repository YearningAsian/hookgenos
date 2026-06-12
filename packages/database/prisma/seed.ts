import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashed = await bcrypt.hash('password123', 12);
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
