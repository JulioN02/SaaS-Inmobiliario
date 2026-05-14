import { Module } from '@nestjs/common';
import { TowerController } from './tower.controller';
import { TowerService } from './tower.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TowerController],
  providers: [TowerService],
  exports: [TowerService],
})
export class TowerModule {}