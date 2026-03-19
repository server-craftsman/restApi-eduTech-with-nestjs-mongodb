import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheService } from './cache/services/cache.service';

/**
 * TaskSchedulerService
 *
 * Centralized cron jobs for periodic background tasks.
 */
@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private readonly cacheService: CacheService) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'cache-health-check',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async runCacheHealthCheck(): Promise<void> {
    const healthy = await this.cacheService.healthCheck();

    if (!healthy) {
      this.logger.warn('Cache health check failed');
      return;
    }

    this.logger.log('Cache health check passed');
  }
}
