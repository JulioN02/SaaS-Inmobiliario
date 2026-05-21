import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { VisitorService } from './visitor.service';
import { VisitorController } from './visitor.controller';

@Module({
  imports: [SharedModule],
  controllers: [VisitorController],
  providers: [VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}