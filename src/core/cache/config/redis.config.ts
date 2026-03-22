import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

/**
 * Redis Cache Configuration
 * Hỗ trợ Upstash Redis (fully managed) hoặc local Redis instance
 */
export const redisConfig = (
  configService: ConfigService,
): CacheModuleOptions => {
  const cacheEnabled = configService.get<string>('CACHE_ENABLED', 'true');
  const cacheStore = configService.get<string>('CACHE_STORE', 'redis');
  const defaultTtl = configService.get<number>('CACHE_TTL_MEDIUM', 300);
  const maxItems = configService.get<number>('CACHE_MAX_ITEMS', 100);

  if (cacheEnabled === 'false' || cacheStore === 'memory') {
    return {
      isGlobal: true,
      ttl: defaultTtl,
    } as CacheModuleOptions;
  }

  const redisUrl = configService.get<string>('REDIS_URL');
  // Always prefer REDIS_URL when provided (Upstash/Redis Cloud/local URL)
  if (redisUrl) {
    return {
      isGlobal: true,
      store: redisStore as unknown as never,
      url: redisUrl,
      ttl: defaultTtl,
      max: maxItems,
    } as unknown as CacheModuleOptions;
  }

  // Fallback: host/port Redis config
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  const redisDb = configService.get<number>('REDIS_DB', 0);

  const redisOptions = {
    host: redisHost,
    port: redisPort,
    db: redisDb,
    ...(redisPassword && { password: redisPassword }),
    // Reconnection strategy
    socket: {
      reconnectStrategy: (retries: number) => {
        const delay = Math.min(retries * 50, 500);
        return delay;
      },
    },
  };

  return {
    isGlobal: true,
    store: redisStore as unknown as never,
    ...redisOptions,
    ttl: defaultTtl,
    max: maxItems,
  } as unknown as CacheModuleOptions;
};

/**
 * Cache TTL Configuration
 * Định nghĩa TTL cho các loại dữ liệu khác nhau
 */
export const CACHE_TTL = {
  // Very Short - 30 seconds (dynamic data)
  VERY_SHORT: 30,

  // Short - 2 minutes (frequently changing data)
  SHORT: 120,

  // Medium - 5 minutes (default)
  MEDIUM: 300,

  // Long - 15 minutes (relatively stable data)
  LONG: 900,

  // Very Long - 1 hour (static data)
  VERY_LONG: 3600,

  // Extra Long - 24 hours (rarely changes)
  EXTRA_LONG: 86400,

  // Entity-specific TTLs
  LESSONS: 600, // 10 minutes
  COURSES: 900, // 15 minutes
  CHAPTERS: 600, // 10 minutes
  MATERIALS: 1800, // 30 minutes
  SUBJECTS: 3600, // 1 hour
  USERS: 1800, // 30 minutes
  EXAMS: 300, // 5 minutes (frequently updated)
  QUIZ_ATTEMPTS: 60, // 1 minute (very dynamic)
  STUDENT_PROFILES: 1800, // 30 minutes
  SEARCH_RESULTS: 300, // 5 minutes
} as const;

/**
 * Cache Key Patterns
 * Định nghĩa patterns cho cache keys - dễ invalidate
 */
export const CACHE_KEYS = {
  // Search
  SEARCH: 'search:',
  SEARCH_LESSONS: 'search:lessons:',
  SEARCH_COURSES: 'search:courses:',
  SEARCH_MATERIALS: 'search:materials:',

  // Lessons
  LESSON: 'lesson:',
  LESSONS_ALL: 'lessons:all:',
  LESSONS_BY_CHAPTER: 'lessons:chapter:',

  // Courses
  COURSE: 'course:',
  COURSES_ALL: 'courses:all:',
  COURSE_CHAPTERS: 'course:chapters:',
  COURSE_LESSONS: 'course:lessons:',

  // Chapters
  CHAPTER: 'chapter:',
  CHAPTERS_BY_COURSE: 'chapters:course:',

  // Materials
  MATERIAL: 'material:',
  MATERIALS_BY_LESSON: 'materials:lesson:',

  // Subjects
  SUBJECT: 'subject:',
  SUBJECTS_ALL: 'subjects:all:',

  // Users
  USER: 'user:',
  USER_PROFILE: 'user:profile:',
  USER_SUBSCRIPTIONS: 'user:subscriptions:',

  // Exams
  EXAM: 'exam:',
  EXAMS_ALL: 'exams:all:',
  EXAM_QUESTIONS: 'exam:questions:',

  // Quiz
  QUIZ_ATTEMPT: 'quiz:attempt:',
  QUIZ_RESULTS: 'quiz:results:',

  // Stats
  DASHBOARD_STATS: 'dashboard:stats:',
  USER_STATS: 'user:stats:',
  COURSE_STATS: 'course:stats:',

  // Admin
  ADMIN_USERS: 'admin:users:',
  ADMIN_COURSES: 'admin:courses:',
  ADMIN_STATS: 'admin:stats:',
} as const;
