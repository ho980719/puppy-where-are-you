import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './places.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Paginated, PlaceDTO } from '@puppy/shared';
import { PlaceSearchQueryDto } from '../dto/place-search.dto';
import { ApiOkResponsePaginated } from '../common/swagger/responses';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'meters, default 2000' })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'comma-separated' })
  @ApiQuery({ name: 'petFriendly', required: false, type: Boolean })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiOkResponsePaginated()
  async list(
    @Query() query: PlaceSearchQueryDto,
  ): Promise<Paginated<PlaceDTO>> {
    const { lat, lng, radius, tags, petFriendly, q, limit, cursor } = query;
    const res = await this.placesService.search({ lat, lng, radius, tags, petFriendly, q, limit, cursor: cursor || null });
    return { items: res.items as unknown as PlaceDTO[], meta: { nextCursor: res.nextCursor } };
  }
}
