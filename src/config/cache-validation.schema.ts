import * as Joi from 'joi';

/**
 * Redis Cache Environment Variables Validation
 * Đảm bảo tất cả cache configs đúng trước khi app khởi chạy
 */
export const cacheValidationSchema = Joi.object({
  // Redis Configuration
  REDIS_URL: Joi.string().uri().optional().messages({
    'string.uri': 'REDIS_URL must be a valid URI (redis://...)',
  }),

  REDIS_HOST: Joi.string().default('localhost').messages({
    'string.base': 'REDIS_HOST must be a string',
  }),

  REDIS_PORT: Joi.number().integer().min(1).max(65535).default(6379).messages({
    'number.base': 'REDIS_PORT must be a number',
    'number.integer': 'REDIS_PORT must be an integer',
  }),

  REDIS_PASSWORD: Joi.string().optional().allow(''),

  REDIS_DB: Joi.number().integer().min(0).max(15).default(0).messages({
    'number.base': 'REDIS_DB must be a number',
  }),

  // Cache Configuration
  CACHE_ENABLED: Joi.boolean().default(true),

  CACHE_STORE: Joi.string().valid('redis', 'memory').default('redis').messages({
    'any.only': 'CACHE_STORE must be either "redis" or "memory"',
  }),

  CACHE_MAX_ITEMS: Joi.number().integer().min(1).default(100).messages({
    'number.base': 'CACHE_MAX_ITEMS must be a number',
  }),

  // Cache TTL Settings (in seconds)
  CACHE_TTL_SHORT: Joi.number().integer().min(1).default(120),
  CACHE_TTL_MEDIUM: Joi.number().integer().min(1).default(300),
  CACHE_TTL_LONG: Joi.number().integer().min(1).default(900),
  CACHE_TTL_VERY_LONG: Joi.number().integer().min(1).default(3600),

  CACHE_TTL_LESSONS: Joi.number().integer().min(1).default(600),
  CACHE_TTL_COURSES: Joi.number().integer().min(1).default(900),
  CACHE_TTL_MATERIALS: Joi.number().integer().min(1).default(1800),
  CACHE_TTL_SEARCH: Joi.number().integer().min(1).default(300),

  // Rate Limiting Configuration
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),

  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000) // 15 minutes
    .messages({
      'number.min': 'RATE_LIMIT_WINDOW_MS must be at least 1000ms',
    }),

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(1000)
    .messages({
      'number.min': 'RATE_LIMIT_MAX_REQUESTS must be at least 1',
    }),

  // Auth endpoints
  RATE_LIMIT_AUTH_WINDOW_MS: Joi.number().integer().min(1000).default(900000),

  RATE_LIMIT_AUTH_MAX_REQUESTS: Joi.number().integer().min(1).default(5),

  // Upload endpoints
  RATE_LIMIT_UPLOAD_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(3600000), // 1 hour

  RATE_LIMIT_UPLOAD_MAX_REQUESTS: Joi.number().integer().min(1).default(20),

  // AI Assistant
  RATE_LIMIT_AI_WINDOW_MS: Joi.number().integer().min(1000).default(3600000), // 1 hour

  RATE_LIMIT_AI_MAX_REQUESTS: Joi.number().integer().min(1).default(10),

  // Performance Settings
  COMPRESSION_ENABLED: Joi.boolean().default(true),
  HTTP_CACHE_ENABLED: Joi.boolean().default(true),

  REQUEST_MAX_PAYLOAD: Joi.string().default('50mb').messages({
    'string.base': 'REQUEST_MAX_PAYLOAD must be a string (e.g., "50mb")',
  }),

  DB_POOL_SIZE: Joi.number().integer().min(1).default(10).messages({
    'number.min': 'DB_POOL_SIZE must be at least 1',
  }),

  QUERY_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .default(30000) // 30 seconds
    .messages({
      'number.min': 'QUERY_TIMEOUT must be at least 1000ms',
    }),
});
