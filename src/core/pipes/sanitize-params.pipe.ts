import {
  BadRequestException,
  Injectable,
  PipeTransform,
  ArgumentMetadata,
} from '@nestjs/common';

/**
 * Global parameter sanitization pipe.
 *
 * Sanitizes all incoming request parameters to prevent:
 * - NoSQL injection attacks
 * - XSS through parameters
 * - Null byte injection
 */
@Injectable()
export class SanitizeParamsPipe implements PipeTransform {
  private readonly dangerousPatterns = [
    /[$](?:where|ne|gt|gte|lt|lte|in|nin|regex)/i, // MongoDB operators
    /['"`]/g, // Quote characters
    /<[^>]*>/g, // HTML tags
  ];

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only process params, query, and body
    if (!['param', 'query', 'body'].includes(metadata.type)) {
      return value;
    }

    return this.sanitizeValue(value);
  }

  /**
   * Recursively sanitize values (strings, objects, arrays).
   */
  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Sanitize string values.
   */
  private sanitizeString(str: string): string {
    let sanitized = str.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Check for MongoDB injection patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(sanitized)) {
        throw new BadRequestException(
          `Invalid parameter value. Detected potentially malicious pattern: "${sanitized.substring(0, 50)}"`,
        );
      }
    }

    // Additional checks for specific patterns
    if (sanitized.includes('$') && sanitized.includes('{')) {
      throw new BadRequestException(
        'Invalid parameter value. Template injection detected.',
      );
    }

    return sanitized;
  }
}
