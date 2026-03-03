import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { OAuthProfile } from '../auth/interfaces';

@Injectable()
export class AuthFacebookService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async generateTokenFromProfile(profile: OAuthProfile) {
    const user = await this.usersService.upsertSocialUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    });
    return { user };
  }
}
