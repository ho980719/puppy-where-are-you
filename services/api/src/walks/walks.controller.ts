import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WalksService } from './walks.service';
import { WalkAppendDto, WalkGetQueryDto, WalkListQueryDto, WalkStartDto } from '../dto/walk.dto';
import { ApiOkResponseData, ApiOkResponsePaginated } from '../common/swagger/responses';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponse, Paginated } from '@puppy/shared';

@ApiTags('walks')
@Controller()
export class WalksController {
  constructor(private readonly walks: WalksService) {}

  @Post('walks')
  @ApiOkResponseData()
  async start(@Body() body: WalkStartDto): Promise<ApiResponse<any>> {
    const walk = await this.walks.start(body);
    return { data: walk as any };
  }

  @Post('walks/:id/points')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponseData()
  async append(@Param('id') id: string, @Body() body: WalkAppendDto): Promise<ApiResponse<any>> {
    const walk = await this.walks.append(id, body);
    return { data: walk as any };
  }

  @Post('walks/:id/end')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponseData()
  async end(@Param('id') id: string): Promise<ApiResponse<any>> {
    const walk = await this.walks.end(id);
    return { data: walk as any };
  }

  @Get('walks/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponseData()
  async get(@Param('id') id: string, @Query() query: WalkGetQueryDto): Promise<ApiResponse<any>> {
    const walk = await this.walks.get(id);
    if ((query as any).includePoints) {
      const limit = (query as any).pointsLimit ?? 2000;
      const points = await this.walks.getPointsLimited(id, limit);
      return { data: { ...walk, points } as any };
    }
    return { data: walk as any };
  }

  // For rendering polyline on the client
  @Get('walks/:id/points')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponsePaginated()
  async points(@Param('id') id: string): Promise<Paginated<any>> {
    const points = await this.walks.getPoints(id);
    return { items: points as any[], meta: { nextCursor: null } };
  }

  @Get('walks')
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponsePaginated()
  async list(@Query() query: WalkListQueryDto): Promise<Paginated<any>> {
    const { userId, limit, cursor } = query as any;
    const res = await this.walks.listByUser(userId, limit ?? 20, cursor);
    return { items: res.items as any[], meta: { nextCursor: res.nextCursor } };
  }
}
