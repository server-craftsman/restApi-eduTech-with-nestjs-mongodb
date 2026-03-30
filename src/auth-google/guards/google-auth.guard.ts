import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const getQueryString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstString = value.find(
      (item): item is string => typeof item === 'string',
    );
    return firstString?.trim() ?? '';
  }

  return '';
};

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const routePath = request.path ?? '';

    // IMPORTANT: Do not inject authorization options on callback exchange.
    // Callback must only use Google-provided code/state parameters.
    if (routePath.endsWith('/callback')) {
      return undefined;
    }

    const promptQuery = getQueryString(request.query.prompt);
    const loginHintQuery = getQueryString(request.query.login_hint);

    const options: Record<string, unknown> = {
      accessType: 'offline',
      includeGrantedScopes: true,
    };

    if (promptQuery) {
      options.prompt = promptQuery;
    }

    if (loginHintQuery) {
      options.loginHint = loginHintQuery;
    }

    return options;
  }
}
