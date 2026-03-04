import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const clientID = configService.get<string>('oauth.google.clientId');
    const clientSecret = configService.get<string>('oauth.google.clientSecret');
    const callbackURL = configService.get<string>('oauth.google.callbackURL');

    super({
      clientID: clientID ?? 'dev-google-client-id',
      clientSecret: clientSecret ?? 'dev-google-client-secret',
      callbackURL: callbackURL ?? 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value ?? null;
    const displayName = profile.displayName ?? 'Google User';
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    const result = await this.usersService.upsertSocialUser({
      provider: 'google',
      providerId: profile.id,
      email,
      displayName,
      avatarUrl,
    });

    return result;
  }
}
