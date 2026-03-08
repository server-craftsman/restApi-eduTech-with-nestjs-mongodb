import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_URL: Joi.string().default('http://localhost:3000'),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),

  // Database (defaults for development)
  MONGODB_URI: Joi.string().default('mongodb://127.0.0.1:27017/edutech'),

  // OpenAI (optional in dev, recommended in production)
  OPENAI_API_KEY: Joi.string().allow('').optional().default(''),
  OPENAI_MODEL: Joi.string().optional().default('gpt-4o-mini'),
  OPENAI_MAX_TOKENS: Joi.number().optional().default(2000),

  // AI Provider selection
  AI_PROVIDER: Joi.string()
    .valid('gemini', 'openai')
    .optional()
    .default('gemini'),
  AI_MAX_OUTPUT_TOKENS: Joi.number().optional().default(2000),
  AI_EMBEDDING_MODEL: Joi.string().optional().default('text-embedding-004'),
  AI_SIMILARITY_THRESHOLD: Joi.number().optional().default(0.65),

  // Google Gemini — FREE tier (gemini-2.0-flash: 15 RPM, 1M tokens/day)
  // Get key: https://aistudio.google.com/apikey
  GEMINI_API_KEY: Joi.string().allow('').optional().default(''),
  GEMINI_MODEL: Joi.string().optional().default('gemini-2.0-flash'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
  CLOUDINARY_FOLDER: Joi.string().allow('').optional().default('edutech'),

  // OAuth: required in production, defaults in development
  GOOGLE_CLIENT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string()
      .allow('')
      .optional()
      .default('dev-google-client-id'),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string()
      .allow('')
      .optional()
      .default('dev-google-client-secret'),
  }),
  GOOGLE_CALLBACK_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string()
      .allow('')
      .optional()
      .default('http://localhost:3000/auth/google/callback'),
  }),
  FACEBOOK_APP_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional().default('dev-facebook-app-id'),
  }),
  FACEBOOK_APP_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string()
      .allow('')
      .optional()
      .default('dev-facebook-app-secret'),
  }),
  FACEBOOK_CALLBACK_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string()
      .allow('')
      .optional()
      .default('http://localhost:3000/auth/facebook/callback'),
  }),

  // JWT: required in production, default in development
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional().default('dev-jwt-secret'),
  }),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string()
      .allow('')
      .optional()
      .default('dev-jwt-refresh-secret'),
  }),
  JWT_REFRESH_EXPIRES_IN_DAYS: Joi.number().integer().positive().default(7),

  // SMTP / Mail
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.string().valid('true', 'false').default('false'),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  // Accepts both plain email ("a@b.com") and RFC 5322 display-name format ("Name <a@b.com>")
  SMTP_FROM_EMAIL: Joi.string().default('no-reply@edutech.local'),
  EMAIL_VERIFICATION_EXPIRES_MINUTES: Joi.number()
    .integer()
    .positive()
    .default(24 * 60),

  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  UPLOAD_FREE_MINUTES: Joi.number().positive().default(180),
  UPLOAD_PRO_MINUTES: Joi.number().min(0).default(0),
  UPLOAD_MAX_FILE_SIZE_BYTES: Joi.number()
    .positive()
    .default(4 * 1024 * 1024 * 1024),
});
