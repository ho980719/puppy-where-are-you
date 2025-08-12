import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { haversineMeters } from '../utils/geo';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    lat: number;
    lng: number;
    radius?: number; // meters
    tags?: string[];
    petFriendly?: boolean;
    q?: string;
    limit?: number;
    cursor?: string | null;
  }) {
    const { lat, lng, radius = 2000, tags, petFriendly, q, limit = 20, cursor } = params;

    // Base filter using Prisma
    const where: any = {};
    if (typeof petFriendly === 'boolean') where.isPetFriendly = petFriendly;
    if (q && q.trim()) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } }
    ];
    if (tags?.length) where.tags = { hasSome: tags };

    const take = Math.min(Math.max(limit, 1), 50);

    const items = await this.prisma.place.findMany({
      where,
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    // Filter by radius in memory (switch to PostGIS later)
    const filtered = items.filter((p) => haversineMeters(lat, lng, p.lat, p.lng) <= radius);

    const hasNext = filtered.length > take;
    const result = filtered.slice(0, take);
    const nextCursor = hasNext ? result[result.length - 1]?.id ?? null : null;

    return { items: result, nextCursor };
  }
}
