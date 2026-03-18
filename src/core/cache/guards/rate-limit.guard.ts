import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../services/rate-limiter.service';
import { RateLimitConfigService } from '../config/rate-limit.config';
import { RATE_LIMIT_TYPES } from '../config/rate-limit.constants';
import { CACHE_METADATA_KEYS } from '../config/cache.metadata';
import { Request, Response } from 'express';

type RequestWithUser = Request & {
  user?: {
    id?: string | number;
  };
};

/**
 * Rate Limit Guard
 * Protects endpoints from abuse bằng Redis-based rate limiting
 * Sử dụng: @UseGuards(RateLimitGuard)
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private rateLimiterService: RateLimiterService,
    private configService: RateLimitConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get identifier (IP, user ID, API key)
    const identifier = this.getIdentifier(request);

    // Get rate limit config từ metadata hoặc use default
    const limitType =
      this.reflector.get<string>(
        CACHE_METADATA_KEYS.RATE_LIMIT_TYPE,
        context.getHandler(),
      ) ?? RATE_LIMIT_TYPES.GLOBAL;
    const config = this.configService.getConfig(limitType);

    // Check rate limit
    const result = await this.rateLimiterService.checkLimit(identifier, config);

    // Set rate limit headers
    response.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
      'Retry-After': (result.resetTime / 1000).toFixed(0),
    });

    if (!result.allowed) {
      this.logger.warn(`Rate limit exceeded for ${identifier} (${limitType})`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message || 'Rate limit exceeded',
          retryAfter: result.resetTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
        {
          cause: new Error('Rate limit exceeded'),
        },
      );
    }

    return true;
  }

  /**
   * Get identifier từ request
   * Priority: User ID > API Key > IP Address
   */
  private getIdentifier(request: RequestWithUser): string {
    // Authenticated user
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    // API Key
    const apiKeyFromHeader = request.header('x-api-key');
    const apiKeyFromQuery =
      typeof request.query.api_key === 'string'
        ? request.query.api_key
        : undefined;
    const apiKey = apiKeyFromHeader ?? apiKeyFromQuery;
    if (apiKey) {
      return `apikey:${apiKey}`;
    }

    // IP Address (fallback)
    const forwardedFor = request.header('x-forwarded-for');
    const realIp = request.header('x-real-ip');
    const ip =
      forwardedFor?.split(',')[0]?.trim() ||
      realIp ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }
}
