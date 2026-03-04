import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { User } from '../users/domain/user';

@ApiTags('Auth - OAuth')
@Controller('auth/oauth/facebook')
export class AuthFacebookController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({
    summary: 'Initiate Facebook OAuth login',
    description:
      'MUST be opened in browser tab, NOT via Swagger Execute button. Copy URL and paste in browser address bar.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Facebook OAuth consent screen',
  })
  @ApiResponse({
    status: 400,
    description: 'Do not call via AJAX/fetch - use browser navigation only',
  })
  async facebookAuth() {
    // Passport guard handles redirect automatically
    // This should never be reached as guard redirects first
  }

  @Get('callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback' })
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
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
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
