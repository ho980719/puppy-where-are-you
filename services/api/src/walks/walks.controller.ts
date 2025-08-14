import { Body, Controller, Get, Param, Post, Query, Sse, MessageEvent } from '@nestjs/common';
import { WalksService } from './walks.service';
import { WalkAppendDto, WalkGetQueryDto, WalkListQueryDto, WalkStartDto } from '../dto/walk.dto';
import { ApiOkResponseData, ApiOkResponsePaginated } from '../common/swagger/responses';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponse, Paginated } from '@puppy/shared';
import { from, interval, map, merge } from 'rxjs';

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

  // Live stream for real-time path rendering
  @Sse('walks/:id/stream')
  @ApiParam({ name: 'id', required: true })
  @ApiQuery({ name: 'fromSeq', required: false, description: 'Backfill points with seq > fromSeq before live updates' })
  stream(@Param('id') id: string, @Query('fromSeq') fromSeq?: string): ReturnType<typeof merge> {
    const startFrom = fromSeq ? Number(fromSeq) : undefined;
    const backfill$ = from(this.walks.getPointsAfter(id, startFrom)).pipe(
      map((items) => ({ data: { type: 'points', fromSeq: items[0]?.seq ?? ((startFrom ?? 0) + 1), items } } as MessageEvent)),
    );
    const live$ = this.walks.observe(id).pipe(map((e) => ({ data: e } as MessageEvent)));
    const heartbeat$ = interval(15000).pipe(map(() => ({ data: { type: 'ping' } } as MessageEvent)));
    return merge(backfill$, live$, heartbeat$);
  }
}
