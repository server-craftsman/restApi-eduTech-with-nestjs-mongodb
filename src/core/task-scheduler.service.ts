import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * TaskSchedulerService
 *
 * Centralized cron jobs for periodic background tasks.
 */
@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);
  private readonly homeEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    const appUrl =
      this.configService.get<string>('app.url') ?? 'http://localhost:3000';
    this.homeEndpoint = `${appUrl.replace(/\/$/, '')}/`;
  }

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'ping-home-endpoint',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async pingHomeEndpoint(): Promise<void> {
    try {
      const response = await axios.get<string>(this.homeEndpoint, {
        timeout: 5000,
      });

      this.logger.log(
        `Home ping success: ${response.status} ${response.statusText}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Home ping failed: ${message}`);
    }
  }
}
