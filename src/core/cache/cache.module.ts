import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from './config/redis.config';
import { CacheService } from './services/cache.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { RateLimitConfigService } from './config/rate-limit.config';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { CacheInterceptor } from './interceptors/cache.interceptor';

/**
 * Cache Module
 * Provides Redis-based caching and rate limiting services.
 */
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: redisConfig,
    }),
  ],
  providers: [
    CacheService,
    RateLimiterService,
    RateLimitConfigService,
    RateLimitGuard,
    CacheInterceptor,
  ],
  exports: [
    CacheService,
    RateLimiterService,
    RateLimitConfigService,
    RateLimitGuard,
    CacheInterceptor,
  ],
})
export class CacheModule {}
