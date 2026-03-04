import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { User } from '../users/domain/user';

@ApiTags('Auth - OAuth')
@Controller('auth/oauth/google')
export class AuthGoogleController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      'MUST be opened in browser tab, NOT via Swagger Execute button. Copy URL and paste in browser address bar.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  @ApiResponse({
    status: 400,
    description: 'Do not call via AJAX/fetch - use browser navigation only',
  })
  async googleAuth() {
    // Passport guard handles redirect automatically
    // This should never be reached as guard redirects first
  }

  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Returns JWT access token, refresh token and session info',
    schema: {
      type: 'object',
      properties: {
        user: { type: 'object' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        sessionId: { type: 'string' },
      },
    },
  })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { user, isNew } = req.user as { user: User; isNew: boolean };
    const deviceInfo = String(req.headers['user-agent'] ?? 'Unknown Device');
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      '0.0.0.0';

    const result = await this.authService.signInWithOAuth(
      { user, isNew },
      { deviceInfo, ipAddress },
    );
    return res.json(result);
  }
}
