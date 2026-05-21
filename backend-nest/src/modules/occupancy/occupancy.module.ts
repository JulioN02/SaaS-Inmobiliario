import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { OccupancyService } from './occupancy.service';
import { OccupancyController } from './occupancy.controller';

@Module({
  imports: [SharedModule],
  controllers: [OccupancyController],
  providers: [OccupancyService],
  exports: [OccupancyService],
})
export class OccupancyModule {}