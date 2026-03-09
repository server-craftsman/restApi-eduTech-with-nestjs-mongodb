import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Catches and formats all HTTP exceptions into a consistent response envelope.
 * Sanitizes error messages in production to prevent information disclosure.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log error details
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - ${exception.message}`,
      exception.stack,
    );

    const body: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Handle both string and object error responses
    if (typeof exceptionResponse === 'string') {
      body.message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const errorObj = exceptionResponse as Record<string, unknown>;
      if (errorObj.message) {
        body.message = errorObj.message;
      }
      if (errorObj.error) {
        body.error = errorObj.error;
      }
      // Preserve custom fields (e.g., requiresUpgrade, requiresRenewal)
      Object.keys(errorObj).forEach((key) => {
        if (!['message', 'error', 'statusCode'].includes(key)) {
          body[key] = errorObj[key];
        }
      });
    }

    response.status(status).json(body);
  }
}
