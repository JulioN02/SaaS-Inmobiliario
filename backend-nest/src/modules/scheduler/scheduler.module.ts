import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutoSuspensionService } from './auto-suspension.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [ScheduleModule.forRoot(), SharedModule],
  providers: [
    AutoSuspensionService,
    {
      provide: 'AUTO_SUSPENSION_ENABLED',
      useFactory: () => {
        return process.env.AUTO_SUSPENSION_ENABLED === 'true';
      },
    },
  ],
})
export class SchedulerModule {}
