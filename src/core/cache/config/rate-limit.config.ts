import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  DEFAULT_RATE_LIMIT_CONFIGS,
  PREMIUM_RATE_LIMIT_CONFIGS,
  RATE_LIMIT_TYPES,
  RateLimitType,
} from './rate-limit.constants';
import { RateLimitConfig } from '../types/rate-limit.types';

@Injectable()
export class RateLimitConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Default rate limit configs cho các endpoints
   */
  getDefaultConfigs(): Record<RateLimitType, RateLimitConfig> {
    return DEFAULT_RATE_LIMIT_CONFIGS;
  }

  /**
   * Lấy config cho một endpoint specific
   */
  getConfig(endpointType: string): RateLimitConfig {
    const configs = this.getDefaultConfigs();
    return (
      configs[endpointType as RateLimitType] || configs[RATE_LIMIT_TYPES.PUBLIC]
    );
  }

  /**
   * Custom rate limit cho premium users
   */
  getPremiumLimits(): Record<string, RateLimitConfig> {
    return PREMIUM_RATE_LIMIT_CONFIGS;
  }
}
