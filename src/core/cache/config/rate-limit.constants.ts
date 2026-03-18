import { RateLimitConfig } from '../types/rate-limit.types';

export const RATE_LIMIT_TYPES = {
  GLOBAL: 'GLOBAL',
  AUTH: 'AUTH',
  PUBLIC: 'PUBLIC',
  API: 'API',
  AUTHENTICATED: 'AUTHENTICATED',
  UPLOAD: 'UPLOAD',
  SEARCH: 'SEARCH',
  AI_ASSISTANT: 'AI_ASSISTANT',
} as const;

export type RateLimitType =
  (typeof RATE_LIMIT_TYPES)[keyof typeof RATE_LIMIT_TYPES];

export const DEFAULT_RATE_LIMIT_CONFIGS: Record<
  RateLimitType,
  RateLimitConfig
> = {
  [RATE_LIMIT_TYPES.GLOBAL]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
    message: 'Too many requests, please try again later',
  },
  [RATE_LIMIT_TYPES.AUTH]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts, please try again later',
  },
  [RATE_LIMIT_TYPES.PUBLIC]: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again after 1 minute',
  },
  [RATE_LIMIT_TYPES.API]: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 60,
    message: 'API rate limit exceeded, please try again later',
  },
  [RATE_LIMIT_TYPES.AUTHENTICATED]: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 300,
    message: 'Rate limit exceeded, please try again later',
  },
  [RATE_LIMIT_TYPES.UPLOAD]: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: 'Upload limit exceeded, please try again later',
  },
  [RATE_LIMIT_TYPES.SEARCH]: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 30,
    message: 'Search rate limit exceeded, please try again later',
  },
  [RATE_LIMIT_TYPES.AI_ASSISTANT]: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'AI assistant rate limit exceeded, please try again later',
  },
};

export const PREMIUM_RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  AUTHENTICATED_PREMIUM: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 600,
  },
  UPLOAD_PREMIUM: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
  },
  AI_ASSISTANT_PREMIUM: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
  },
};
