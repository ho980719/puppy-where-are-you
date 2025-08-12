import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReviewCreateDto } from '../dto/review-create.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(placeId: string) {
    const place = await this.prisma.place.findUnique({ where: { id: placeId }, select: { id: true } });
    if (!place) throw new NotFoundException('Place not found');
    const reviews = await this.prisma.review.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, content: true, photos: true, createdAt: true, user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    const agg = await this.prisma.review.aggregate({ _avg: { rating: true }, where: { placeId } });
    return { reviews, avgRating: agg._avg.rating ?? null };
  }

  async create(placeId: string, input: ReviewCreateDto) {
    const { userId, rating, content, photos } = input;
    if (rating < 1 || rating > 5) throw new BadRequestException('rating must be 1..5');
    const [place, user] = await Promise.all([
      this.prisma.place.findUnique({ where: { id: placeId }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ]);
    if (!place) throw new NotFoundException('Place not found');
    if (!user) throw new NotFoundException('User not found');
    const review = await this.prisma.review.create({ data: { placeId, userId, rating, content: content ?? '', photos: photos ?? [] } });
    const agg = await this.prisma.review.aggregate({ _avg: { rating: true }, where: { placeId } });
    return { review, avgRating: agg._avg.rating ?? null };
  }
}
