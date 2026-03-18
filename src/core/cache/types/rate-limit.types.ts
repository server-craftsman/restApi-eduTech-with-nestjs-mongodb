/**
 * Shared rate-limit types.
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}

export type RateLimitConfigMap = Record<string, RateLimitConfig>;

export type PremiumRateLimitType =
  | 'AUTHENTICATED_PREMIUM'
  | 'UPLOAD_PREMIUM'
  | 'AI_ASSISTANT_PREMIUM';
