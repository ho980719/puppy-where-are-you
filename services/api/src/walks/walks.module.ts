import { Module } from '@nestjs/common';
import { WalksController } from './walks.controller';
import { WalksService } from './walks.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [WalksController],
  providers: [WalksService, PrismaService],
})
export class WalksModule {}
