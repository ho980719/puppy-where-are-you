import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const places = [
    { id: 'cafe-paws', name: 'Cafe Paws', description: 'Pet-friendly cafe', address: 'Seoul', lat: 37.5665, lng: 126.9780, tags: ['cafe', 'coffee'], isPetFriendly: true },
    { id: 'han-river-park', name: 'Han River Park', description: 'Great for walks', address: 'Seoul', lat: 37.5283, lng: 126.9326, tags: ['park', 'walk'], isPetFriendly: true },
    { id: 'pet-mart', name: 'Pet Mart', description: 'Pet supplies', address: 'Seoul', lat: 37.5013, lng: 127.0396, tags: ['shop'], isPetFriendly: true },
    { id: 'city-museum', name: 'City Museum', description: 'Usually no pets', address: 'Seoul', lat: 37.5796, lng: 126.9770, tags: ['museum'], isPetFriendly: false },
    { id: 'river-trail', name: 'River Trail', description: 'Scenic trail', address: 'Seoul', lat: 37.55, lng: 126.99, tags: ['trail', 'walk'], isPetFriendly: true },
  ];

  for (const p of places) {
    await prisma.place.upsert({
      where: { id: p.id },
      update: p,
      create: p,
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
