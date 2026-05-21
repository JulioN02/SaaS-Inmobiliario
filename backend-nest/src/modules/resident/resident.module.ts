import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ResidentService } from './resident.service';
import { ResidentController } from './resident.controller';

@Module({
  imports: [SharedModule],
  controllers: [ResidentController],
  providers: [ResidentService],
  exports: [ResidentService],
})
export class ResidentModule {}