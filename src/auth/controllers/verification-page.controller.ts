import { Controller, Get, Query, Render } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class VerificationPageController {
  constructor(private readonly configService: ConfigService) {}
  @Get('verify-email')
  @Render('verify-email')
  verifyEmailPage(@Query('token') token: string) {
    return {
      token,
      apiUrl:
        this.configService.get<string>('app.url') || 'http://localhost:3000',
    };
  }

  @Get('email-verified')
  @Render('email-verified')
  emailVerifiedPage() {
    return {
      appUrl:
        this.configService.get<string>('app.url') || 'http://localhost:3000',
    };
  }

  @Get('verification-error')
  @Render('verification-error')
  verificationErrorPage(@Query('reason') reason?: string) {
    return {
      reason: reason || 'Unknown error',
      appUrl:
        this.configService.get<string>('app.url') || 'http://localhost:3000',
    };
  }
}
