const nodeEnv = process.env.NODE_ENV ?? 'development';

const getEnv = (key: string, fallback?: string): string =>
  process.env[key] !== undefined ? process.env[key] : (fallback as string);

export const getDatabaseConfig = () => ({
  mongoUri: getEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/edutech'),
});

export default () => ({
  nodeEnv,
  port: parseInt(process.env.PORT ?? '3000', 10),
  app: {
    title: 'EduTech API',
    version: '1.0.0',
    url: getEnv('APP_URL', 'http://localhost:3000'),
  },
  api: {
    prefix: getEnv('API_PREFIX', 'api'),
    version: getEnv('API_VERSION', 'v1'),
  },
  database: getDatabaseConfig(),
  storage: {
    type: 'cloudinary',
    cloudName: getEnv('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: getEnv('CLOUDINARY_API_KEY', ''),
    apiSecret: getEnv('CLOUDINARY_API_SECRET', ''),
    folder: getEnv('CLOUDINARY_FOLDER', 'edutech'),
  },
  oauth: {
    google: {
      clientId: getEnv('GOOGLE_CLIENT_ID', 'dev-google-client-id'),
      clientSecret: getEnv('GOOGLE_CLIENT_SECRET', 'dev-google-client-secret'),
      callbackURL: getEnv(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/auth/google/callback',
      ),
    },
    facebook: {
      clientId: getEnv('FACEBOOK_APP_ID', 'dev-facebook-app-id'),
      clientSecret: getEnv('FACEBOOK_APP_SECRET', 'dev-facebook-app-secret'),
      callbackURL: getEnv(
        'FACEBOOK_CALLBACK_URL',
        'http://localhost:3000/auth/facebook/callback',
      ),
    },
  },
  jwt: {
    secret: getEnv('JWT_SECRET', 'dev-jwt-secret'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '8h'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev-jwt-refresh-secret'),
    refreshExpiresInDays: parseInt(
      getEnv('JWT_REFRESH_EXPIRES_IN_DAYS', '7'),
      10,
    ),
  },
  mail: {
    service: getEnv('SMTP_SERVICE', ''),
    host: getEnv('SMTP_HOST', getEnv('MAIL_HOST', '')),
    port: parseInt(getEnv('SMTP_PORT', getEnv('MAIL_PORT', '587')), 10),
    secure: getEnv('SMTP_SECURE', getEnv('MAIL_SECURE', 'false')) === 'true',
    user: getEnv('SMTP_USER', getEnv('MAIL_USER', '')),
    pass: getEnv('SMTP_PASS', getEnv('MAIL_PASSWORD', '')),
    fromEmail: getEnv(
      'SMTP_FROM_EMAIL',
      getEnv('MAIL_DEFAULT_EMAIL', 'no-reply@edutech.local'),
    ),
    fromName: getEnv('MAIL_DEFAULT_NAME', 'EduTech'),
    verificationTokenExpiresMinutes: parseInt(
      getEnv('EMAIL_VERIFICATION_EXPIRES_MINUTES', String(24 * 60)),
      10,
    ),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:3000',
    ],
  },
  sepay: {
    apiKey: getEnv('SEPAY_API_KEY', ''),
    bankAccount: getEnv('SEPAY_BANK_ACCOUNT', ''),
    bankName: getEnv('SEPAY_BANK_NAME', 'MBBank'),
    webhookSecret: getEnv('SEPAY_WEBHOOK_SECRET', ''),
  },
  novu: {
    apiKey: getEnv('NOVU_API_KEY', ''),
    appId: getEnv('NOVU_APP_ID', ''),
    socketUrl: getEnv('NOVU_SOCKET_URL', 'wss://socket.novu.co'),
    inboxHmacSecret: getEnv('NOVU_INBOX_HMAC_SECRET', ''),
    subscriberIdPrefix: getEnv('NOVU_SUBSCRIBER_PREFIX', 'edutech_'),
  },
  ai: {
    provider: getEnv('AI_PROVIDER', 'gemini') as 'gemini' | 'openai',
    // Gemini (free tier)
    geminiApiKey: getEnv('GEMINI_API_KEY', ''),
    geminiModel: getEnv('GEMINI_MODEL', 'gemini-2.0-flash'),
    // OpenAI (paid)
    openaiApiKey: getEnv('OPENAI_API_KEY', ''),
    openaiModel: getEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    openaiMaxTokens: parseInt(getEnv('OPENAI_MAX_TOKENS', '2000'), 10),
    // Shared
    maxOutputTokens: parseInt(getEnv('AI_MAX_OUTPUT_TOKENS', '2000'), 10),
    // Gemini embedding model (used by POST /training/train)
    embeddingModel: getEnv('AI_EMBEDDING_MODEL', 'text-embedding-004'),
    similarityThreshold: parseFloat(getEnv('AI_SIMILARITY_THRESHOLD', '0.65')),
  },
});
