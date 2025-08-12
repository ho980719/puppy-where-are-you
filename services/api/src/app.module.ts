import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { PlacesModule } from './places/places.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WalksModule } from './walks/walks.module';

@Module({
  imports: [UsersModule, PlacesModule, ReviewsModule, WalksModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
