import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalkAppendDto, WalkStartDto } from '../dto/walk.dto';
import { haversine } from '../common/utils/geo';

@Injectable()
export class WalksService {
  constructor(private readonly prisma: PrismaService) {}

  async start(input: WalkStartDto) {
    const { userId, note } = input;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    const walk = await this.prisma.walk.create({ data: { userId, startAt: new Date(), path: undefined, photos: [], note, distanceMeters: 0 } });
    return walk;
  }

  async append(walkId: string, input: WalkAppendDto) {
    const walk = await this.prisma.walk.findUnique({ where: { id: walkId }, select: { id: true, endAt: true, distanceMeters: true } });
    if (!walk) throw new NotFoundException('Walk not found');
    if (walk.endAt) throw new BadRequestException('Walk already ended');

    // get last point to continue seq and distance
    const lastPoint = await this.prisma.walkPoint.findFirst({ where: { walkId }, orderBy: { seq: 'desc' } });
    let nextSeq = lastPoint ? lastPoint.seq + 1 : 1;
    let distance = walk.distanceMeters ?? 0;
    let prev = lastPoint ? { lat: lastPoint.lat, lng: lastPoint.lng } : null;

    const batchSize = 1000;
    let buffer: { walkId: string; seq: number; lat: number; lng: number; recordedAt: Date }[] = [];
    for (const p of input.points) {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      const recordedAt = p.recordedAt ? new Date(p.recordedAt) : new Date();
      if (prev) {
        distance += haversine(prev, { lat, lng });
      }
      buffer.push({ walkId, seq: nextSeq++, lat, lng, recordedAt });
      prev = { lat, lng };

      if (buffer.length >= batchSize) {
        await this.prisma.walkPoint.createMany({ data: buffer });
        buffer = [];
      }
    }

    if (buffer.length > 0) {
      await this.prisma.walkPoint.createMany({ data: buffer });
    }

    await this.prisma.walk.update({ where: { id: walkId }, data: { distanceMeters: distance } });
    return this.prisma.walk.findUnique({ where: { id: walkId } });
  }

  async end(walkId: string) {
    const walk = await this.prisma.walk.findUnique({ where: { id: walkId } });
    if (!walk) throw new NotFoundException('Walk not found');
    if (walk.endAt) throw new BadRequestException('Walk already ended');

    const endAt = new Date();
    const durationSeconds = Math.floor((endAt.getTime() - new Date(walk.startAt).getTime()) / 1000);
    const updated = await this.prisma.walk.update({ where: { id: walkId }, data: { endAt, durationSeconds } });
    return updated;
  }

  async get(walkId: string) {
    const walk = await this.prisma.walk.findUnique({ where: { id: walkId } });
    if (!walk) throw new NotFoundException('Walk not found');
    return walk;
  }

  async getPoints(walkId: string) {
    const exists = await this.prisma.walk.findUnique({ where: { id: walkId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Walk not found');
    const points = await this.prisma.walkPoint.findMany({ where: { walkId }, orderBy: { seq: 'asc' }, select: { seq: true, lat: true, lng: true, recordedAt: true } });
    return points;
  }

  async getPointsLimited(walkId: string, limit: number) {
    const exists = await this.prisma.walk.findUnique({ where: { id: walkId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Walk not found');
    // Simple cap (no downsampling): first N points in sequence
    const points = await this.prisma.walkPoint.findMany({
      where: { walkId },
      orderBy: { seq: 'asc' },
      take: limit,
      select: { seq: true, lat: true, lng: true, recordedAt: true },
    });
    return points;
  }

  async listByUser(userId: string, limit = 20, cursor?: string | null) {
    const where = { userId };
    const items = await this.prisma.walk.findMany({
      where,
      orderBy: { startAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, userId: true, startAt: true, endAt: true, distanceMeters: true, durationSeconds: true, createdAt: true },
    });
    let nextCursor: string | null = null;
    if (items.length > limit) {
      const next = items.pop();
      nextCursor = next!.id;
    }
    return { items, nextCursor };
  }
}
