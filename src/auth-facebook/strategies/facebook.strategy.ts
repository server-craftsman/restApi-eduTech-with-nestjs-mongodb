import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const clientID = configService.get<string>('oauth.facebook.clientId');
    const clientSecret = configService.get<string>(
      'oauth.facebook.clientSecret',
    );
    const callbackURL = configService.get<string>('oauth.facebook.callbackURL');

    super({
      clientID: clientID ?? 'dev-facebook-app-id',
      clientSecret: clientSecret ?? 'dev-facebook-app-secret',
      callbackURL:
        callbackURL ?? 'http://localhost:3000/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'photos'],
      enableProof: true,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value ?? null;
    const displayName = profile.displayName ?? 'Facebook User';
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    const result = await this.usersService.upsertSocialUser({
      provider: 'facebook',
      providerId: profile.id,
      email,
      displayName,
      avatarUrl,
    });

    return result;
  }
}
