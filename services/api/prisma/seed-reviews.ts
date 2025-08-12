import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  if (!alice || !bob) throw new Error('Seed users not found. Run `pnpm --filter @puppy/api run seed` first.');

  const placeIds = ['han-river-park', 'cafe-paws'];
  for (const pid of placeIds) {
    const place = await prisma.place.findUnique({ where: { id: pid } });
    if (!place) {
      console.warn(`Place ${pid} not found, skipping.`);
      continue;
    }
    await prisma.review.upsert({
      where: { id: `${pid}-alice-review` },
      update: {},
      create: {
        id: `${pid}-alice-review`,
        placeId: place.id,
        userId: alice.id,
        rating: 5,
        content: '아주 좋아요!',
        photos: [],
      },
    });
    await prisma.review.upsert({
      where: { id: `${pid}-bob-review` },
      update: {},
      create: {
        id: `${pid}-bob-review`,
        placeId: place.id,
        userId: bob.id,
        rating: 4,
        content: '강아지랑 가기 좋음',
        photos: [],
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
