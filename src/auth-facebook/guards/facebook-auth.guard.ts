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
export class FacebookAuthGuard extends AuthGuard('facebook') {
	getAuthenticateOptions(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		const routePath = request.path ?? '';

		// IMPORTANT: callback route must not include custom auth options.
		if (routePath.endsWith('/callback')) {
			return undefined;
		}

		const authType = getQueryString(request.query.auth_type);
		const rerequest = getQueryString(request.query.rerequest);

		const options: Record<string, unknown> = {
			scope: ['public_profile', 'email'],
		};

		// Support forcing permission re-prompt when email was previously denied.
		// Example: /auth/oauth/facebook/login?rerequest=true
		if (authType) {
			options.authType = authType;
		} else if (rerequest.toLowerCase() === 'true') {
			options.authType = 'rerequest';
		}

		return options;
	}
}
