import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RateLimitConfigService } from '../config/rate-limit.config';
import { RateLimitConfig } from '../types/rate-limit.types';

/**
 * Redis-based Rate Limiter Service
 * Implements Token Bucket algorithm cho flexible rate limiting
 */
@Injectable()
export class RateLimiterService {
  constructor(
    private cacheService: CacheService,
    private configService: RateLimitConfigService,
  ) {}

  /**
   * Check if request is allowed
   * Returns: { allowed: boolean, remaining: number, resetTime: number }
   */
  async checkLimit(
    identifier: string, // IP address, user ID, API key, etc.
    config: RateLimitConfig,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const windowKey = `ratelimit:${identifier}`;
    const countKey = `${windowKey}:count`;
    const resetKey = `${windowKey}:reset`;

    try {
      // Lấy current count trong window
      const current = (await this.cacheService.get<number>(countKey)) ?? 0;
      const resetTime =
        (await this.cacheService.get<number>(resetKey)) ?? Date.now();

      // Check if window expired
      if (Date.now() >= resetTime) {
        // Reset counter
        await this.cacheService.set(countKey, 1, config.windowMs / 1000);
        await this.cacheService.set(
          resetKey,
          Date.now() + config.windowMs,
          config.windowMs / 1000,
        );

        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: Date.now() + config.windowMs,
        };
      }

      // Window still active, check limit
      const allowed = current < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - current - 1);

      if (allowed) {
        // Increment counter
        await this.cacheService.increment(countKey);
      }

      return {
        allowed,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow request (fail open)
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }
  }

  /**
   * Check limit với default config
   */
  async checkLimitByType(
    identifier: string,
    limitType: string,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const config = this.configService.getConfig(limitType);
    return this.checkLimit(identifier, config);
  }

  /**
   * Reset limit untuk specific identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    const windowKey = `ratelimit:${identifier}`;
    await this.cacheService.deleteMany([
      `${windowKey}:count`,
      `${windowKey}:reset`,
    ]);
  }

  /**
   * Get remaining requests cho identifier
   */
  async getRemaining(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<number> {
    const countKey = `ratelimit:${identifier}:count`;
    const current = (await this.cacheService.get<number>(countKey)) ?? 0;
    return Math.max(0, config.maxRequests - current);
  }

  /**
   * Get rate limit status
   */
  async getStatus(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<{
    used: number;
    remaining: number;
    limit: number;
    resetTime: number;
  }> {
    const countKey = `ratelimit:${identifier}:count`;
    const resetKey = `ratelimit:${identifier}:reset`;

    const used = (await this.cacheService.get<number>(countKey)) ?? 0;
    const resetTime =
      (await this.cacheService.get<number>(resetKey)) ??
      Date.now() + config.windowMs;

    return {
      used,
      remaining: Math.max(0, config.maxRequests - used),
      limit: config.maxRequests,
      resetTime,
    };
  }
}
