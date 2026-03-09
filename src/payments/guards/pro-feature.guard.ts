import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserSubscriptionService } from '../../user-subscriptions/user-subscription.service';

/**
 * ProFeatureGuard — Paywall enforcement guard.
 *
 * Apply this guard to any endpoint that requires a Pro subscription.
 * If the user is on the Free tier (no active subscription), the guard
 * returns HTTP 402 Payment Required with a paywall response body.
 *
 * Usage:
 * ```ts
 * @UseGuards(JwtAuthGuard, ProFeatureGuard)
 * @Get('premium-content')
 * async getPremiumContent(@CurrentUser() user: User) { ... }
 * ```
 *
 * The 402 response body includes:
 * - `requiresUpgrade: true` — tells the client to show the paywall
 * - `upgradeUrl` — deep link to the upgrade screen
 * - `message` — user-friendly message
 */
@Injectable()
export class ProFeatureGuard implements CanActivate {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: string } }>();
    const user = request.user;

    // If no user is attached (JwtAuthGuard should run first), deny
    if (!user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const isValid = await this.userSubscriptionService.isSubscriptionValid(
      user.id,
    );

    if (!isValid) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          requiresUpgrade: true,
          message:
            'Tính năng này yêu cầu gói Pro. Vui lòng nâng cấp để tiếp tục.',
          upgradeUrl: '/payments/plans/compare',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
