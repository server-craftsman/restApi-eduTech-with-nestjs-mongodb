/**
 * Security configuration for the application.
 *
 * Includes:
 * - Rate limiting / throttling (DDoS protection)
 * - Input sanitization (NoSQL injection prevention)
 * - Security headers (helmet)
 * - Parameter validation rules
 */

/**
 * Default rate limiting configuration (DDoS protection).
 *
 * Global limits apply to all endpoints unless overridden by @Throttle decorator.
 * Format: ttl (milliseconds) and limit (requests per ttl window)
 */
export const THROTTLE_CONFIG = [
  {
    name: 'global',
    ttl: 60000, // 60 seconds
    limit: 100, // 100 requests per minute
  },
  {
    name: 'api',
    ttl: 60000,
    limit: 50, // 50 requests per minute for API endpoints
  },
];

/**
 * Stricter rate limiting for authentication endpoints (prevent brute force).
 */
export const AUTH_THROTTLE = {
  ttl: 900000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
};

/**
 * Payment endpoints rate limiting (prevent abuse).
 */
export const PAYMENT_THROTTLE = {
  ttl: 3600000, // 1 hour
  limit: 10, // 10 payment initiations per hour
};

/**
 * Upload endpoints rate limiting.
 */
export const UPLOAD_THROTTLE = {
  ttl: 3600000, // 1 hour
  limit: 20, // 20 uploads per hour
};

/**
 * Swagger endpoint exclusions (don't count against rate limits).
 */
export const THROTTLE_SKIP_ROUTES = [
  '/swagger',
  '/swagger-ui.html',
  '/swagger-json',
  '/api-json',
];

/**
 * HTTP headers to sanitize (prevent header injection).
 */
export const SANITIZE_HEADERS = [
  'x-powered-by',
  'server',
  'x-aspnet-version',
  'x-runtime-version',
];

/**
 * Sensitive query parameters that should be logged with caution.
 */
export const SENSITIVE_PARAMS = ['password', 'token', 'secret', 'apiKey'];

/**
 * Maximum JSON payload size (prevent large payload attacks).
 */
export const MAX_JSON_PAYLOAD_SIZE = '10mb';

/**
 * Maximum URL encoded payload size.
 */
export const MAX_FORM_PAYLOAD_SIZE = '10mb';
