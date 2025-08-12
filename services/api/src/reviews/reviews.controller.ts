import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiBody, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiResponse, PageMeta, Paginated, ReviewDTO } from '@puppy/shared';
import { ReviewCreateDto, ReviewCreateSchema } from '../dto/review-create.dto';
import { ApiOkResponseData, ApiOkResponsePaginated } from '../common/swagger/responses';

@ApiTags('reviews')
@Controller('places/:placeId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiParam({ name: 'placeId', required: true })
  @ApiOkResponsePaginated()
  async list(@Param('placeId') placeId: string): Promise<ApiResponse<Paginated<ReviewDTO>>> {
    const res = await this.reviewsService.list(placeId);
    const meta: PageMeta = { avgRating: res.avgRating };
    return { data: { items: (res.reviews as unknown) as ReviewDTO[], meta } };
  }

  @Post()
  @ApiParam({ name: 'placeId', required: true })
  @ApiOkResponseData()
  @ApiBody({ schema: { $ref: undefined }, description: 'See DTO schema in code' })
  async create(@Param('placeId') placeId: string, @Body() body: ReviewCreateDto): Promise<ApiResponse<ReviewDTO>> {
    const res = await this.reviewsService.create(placeId, body);
    return { data: (res.review as unknown) as ReviewDTO };
  }
}
