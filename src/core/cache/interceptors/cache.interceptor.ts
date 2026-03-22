import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { from, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CACHE_KEYS } from '../config/redis.config';
import { Request, Response } from 'express';

type RequestWithUser = Request & {
  user?: {
    id?: string | number;
  };
};

type CacheValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | CacheValue[];

type MaybeExpressResponse = {
  setHeader?: (...args: unknown[]) => unknown;
  status?: (...args: unknown[]) => unknown;
  json?: (...args: unknown[]) => unknown;
  send?: (...args: unknown[]) => unknown;
};

/**
 * Cache Interceptor
 * Automatically cache GET responses dựa trên URL và query parameters
 * Đặc biệt hữu dụng cho frequently accessed endpoints (read-only)
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  // Endpoints không nên cache (POST, PUT, DELETE, hoặc dynamic responses)
  private readonly noCachePatterns = [
    /\/auth\//,
    /\/login/,
    /\/logout/,
    /\/sign-up/,
    /\/password/,
    /\/upload/,
    /\/admin\//,
    /\/(post|put|delete|patch)/i,
  ];

  // Chỉ cache GET requests cho endpoints này
  private readonly cacheablePatterns = [
    /\/lessons/,
    /\/courses/,
    /\/chapters/,
    /\/materials/,
    /\/subjects/,
    /\/exams/,
    /\/quiz/,
    /\/search/,
    /\/public/,
  ];

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;

    const cacheEnabled = this.configService.get<string>(
      'CACHE_ENABLED',
      'true',
    );
    const httpCacheEnabled = this.configService.get<string>(
      'HTTP_CACHE_ENABLED',
      'true',
    );
    const isCacheOn = cacheEnabled !== 'false' && httpCacheEnabled !== 'false';

    if (!isCacheOn) {
      return next.handle();
    }

    // Chỉ cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Check if endpoint should be cached
    if (!this.shouldCache(request.path)) {
      return next.handle();
    }

    // Generate cache key từ URL + query params
    const cacheKey = this.generateCacheKey(request);

    // Thử lấy từ cache
    return from(this.getCachedResponse(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached !== null && cached !== undefined) {
          this.logger.debug(`Cache HIT for ${cacheKey}`);
          if (this.canSetHeaders(response)) {
            response.set({
              'X-Cache': 'HIT',
              'Cache-Control': 'public, max-age=300',
            });
          }
          return of(cached);
        }

        this.logger.debug(`Cache MISS for ${cacheKey}`);
        return next.handle().pipe(
          tap((data: unknown) => {
            if (this.isExpressResponse(data)) {
              return;
            }

            const ttl = this.extractTtlFromHeaders(response);
            this.cacheService.set(cacheKey, data, ttl).catch((err) => {
              this.logger.warn(`Failed to cache ${cacheKey}:`, err);
            });

            if (this.canSetHeaders(response)) {
              response.set({
                'X-Cache': 'MISS',
                'Cache-Control': `public, max-age=${ttl || 300}`,
              });
            }
          }),
        );
      }),
    );
  }

  private canSetHeaders(response: Response): boolean {
    return !response.headersSent && !response.writableEnded;
  }

  private isExpressResponse(value: unknown): value is MaybeExpressResponse {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as MaybeExpressResponse;
    return (
      typeof candidate.setHeader === 'function' &&
      typeof candidate.status === 'function' &&
      (typeof candidate.json === 'function' ||
        typeof candidate.send === 'function')
    );
  }

  /**
   * Check if endpoint should be cached
   */
  private shouldCache(path: string): boolean {
    // Exclude no-cache patterns
    if (this.noCachePatterns.some((pattern) => pattern.test(path))) {
      return false;
    }

    // Only cache cacheable patterns
    return this.cacheablePatterns.some((pattern) => pattern.test(path));
  }

  /**
   * Generate cache key từ request
   */
  private generateCacheKey(request: RequestWithUser): string {
    const path = request.path;
    const queryString = request.url.split('?')[1];
    const userId = request.user?.id;

    // Include user ID trong key nếu authenticated (user-specific caching)
    if (userId) {
      return `${CACHE_KEYS.SEARCH}${userId}:${path}:${queryString || 'default'}`;
    }

    // Public cache
    return `${CACHE_KEYS.SEARCH}public:${path}:${queryString || 'default'}`;
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(
    key: string,
  ): Promise<CacheValue | undefined> {
    try {
      return await this.cacheService.get<CacheValue>(key);
    } catch (error) {
      this.logger.warn(`Failed to get cache ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Extract TTL from response headers
   */
  private extractTtlFromHeaders(response: Response): number {
    const cacheControl = response.getHeader('Cache-Control');
    if (typeof cacheControl === 'string' && cacheControl.includes('max-age=')) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match?.[1]) {
        return parseInt(match[1], 10);
      }
    }
    return 300; // Default 5 minutes
  }
}
