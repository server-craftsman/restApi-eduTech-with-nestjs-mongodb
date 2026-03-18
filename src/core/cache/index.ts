/**
 * Cache Module Barrel Export
 */
export { CACHE_TTL, CACHE_KEYS, redisConfig } from './config/redis.config';

export {
  CacheService,
  createCacheKey,
  createSearchCacheKey,
  invalidateSearchCache,
} from './services/cache.service';

export { RateLimitConfigService } from './config/rate-limit.config';
export {
  RATE_LIMIT_TYPES,
  DEFAULT_RATE_LIMIT_CONFIGS,
  PREMIUM_RATE_LIMIT_CONFIGS,
} from './config/rate-limit.constants';
export type { RateLimitType } from './config/rate-limit.constants';
export type {
  RateLimitConfig,
  RateLimitConfigMap,
} from './types/rate-limit.types';

export { CACHE_METADATA_KEYS } from './config/cache.metadata';

export { RateLimiterService } from './services/rate-limiter.service';
export { RateLimitGuard } from './guards/rate-limit.guard';
export { CacheInterceptor } from './interceptors/cache.interceptor';

export {
  Cacheable,
  CacheInvalidate,
  CacheTTL,
  RateLimit,
  RateLimitOptions,
  NoCache,
} from './decorators/cache.decorators';

export { CacheModule } from './cache.module';
