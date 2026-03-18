import { SetMetadata } from '@nestjs/common';
import { CACHE_METADATA_KEYS } from '../config/cache.metadata';

/**
 * @Cacheable() Decorator
 * Automatically cache method result (cho service methods)
 *
 * Usage:
 * @Cacheable('lesson:', { ttl: CACHE_TTL.LESSONS })
 * async findById(id: string) { ... }
 */
export const Cacheable = (
  keyPrefix: string,
  options?: { ttl?: number; condition?: (args: any[]) => boolean },
) => {
  return SetMetadata(CACHE_METADATA_KEYS.CACHEABLE, {
    keyPrefix,
    ttl: options?.ttl,
    condition: options?.condition,
  });
};

/**
 * @CacheInvalidate() Decorator
 * Invalidate cache pattern khi method execute
 *
 * Usage:
 * @CacheInvalidate(['lesson:', 'lessons:all:'])
 * async create(dto: CreateLessonDto) { ... }
 */
export const CacheInvalidate = (patterns: string[]) => {
  return SetMetadata(CACHE_METADATA_KEYS.CACHE_INVALIDATE, patterns);
};

/**
 * @CacheTTL() Decorator
 * Set custom TTL cho method result
 *
 * Usage:
 * @CacheTTL(CACHE_TTL.LONG)
 * async getStatistics() { ... }
 */
export const CacheTTL = (ttl: number) => {
  return SetMetadata(CACHE_METADATA_KEYS.CACHE_TTL, ttl);
};

/**
 * @RateLimitOptions() Decorator
 * Custom rate limit config cho endpoint
 *
 * Usage:
 * @RateLimitOptions({ windowMs: 60000, maxRequests: 10 })
 * async upload(file: Express.Multer.File) { ... }
 */
export const RateLimitOptions = (config: {
  windowMs?: number;
  maxRequests?: number;
}) => {
  return SetMetadata(CACHE_METADATA_KEYS.RATE_LIMIT_CONFIG, config);
};

/**
 * @RateLimit() Decorator
 * Set endpoint rate limit profile.
 *
 * Usage:
 * @RateLimit('AUTH')
 */
export const RateLimit = (limitType: string) => {
  return SetMetadata(CACHE_METADATA_KEYS.RATE_LIMIT_TYPE, limitType);
};

/**
 * @NoCache() Decorator
 * Bypass cache cho method
 *
 * Usage:
 * @NoCache()
 * async getLiveData() { ... }
 */
export const NoCache = () => {
  return SetMetadata(CACHE_METADATA_KEYS.NO_CACHE, true);
};
