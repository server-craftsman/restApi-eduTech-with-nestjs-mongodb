/**
 * Metadata keys used by cache/rate-limit decorators & guards.
 * Keep them centralized to avoid typo-related bugs.
 */
export const CACHE_METADATA_KEYS = {
  CACHEABLE: 'cacheable',
  CACHE_INVALIDATE: 'cacheInvalidate',
  CACHE_TTL: 'cacheTtl',
  RATE_LIMIT_TYPE: 'rateLimitType',
  RATE_LIMIT_CONFIG: 'rateLimitConfig',
  NO_CACHE: 'noCache',
} as const;
