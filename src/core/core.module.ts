import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { TaskSchedulerService } from './task-scheduler.service';

@Module({
  imports: [CacheModule],
  providers: [TaskSchedulerService],
  exports: [CacheModule, TaskSchedulerService],
})
export class CoreModule {}
