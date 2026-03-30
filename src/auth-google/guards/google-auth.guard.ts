import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

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

    const promptQuery = String(request.query.prompt ?? '').trim();
    const loginHintQuery = String(request.query.login_hint ?? '').trim();

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
