import { Controller, Get, Post, Body, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { MobileGoogleSignInDto } from '../auth/dto/mobile-google-signin.dto';
import { User } from '../users/domain/user';
import { BaseController } from '../core/base/base.controller';

@ApiTags('Auth - OAuth')
@Controller('auth/oauth/google')
export class AuthGoogleController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

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

  // ─── Mobile OAuth Endpoint (React Native) ────────────────────────────────

  /**
   * Mobile Google Sign-In for React Native
   * - Client sends Google ID Token from react-native-google-signin
   * - Backend verifies the token and creates/returns user with JWT tokens
   * - Supports role selection for new users (Student, Teacher, Parent)
   */
  @Post('mobile-signin')
  @ApiOperation({
    summary: 'Google Sign-In for React Native (Mobile)',
    description: `
      **For React Native/Mobile apps only**
      
      Flow:
      1. User taps "Sign in with Google" in React Native app
      2. App uses @react-native-google-signin/google-signin to get idToken
      3. App sends idToken to this endpoint
      4. Backend verifies token, creates/updates user, returns JWT tokens
      
      **Response:**
      - New user: { needsProfileCompletion: true, completionToken }
      - Returning user: { needsProfileCompletion: false, user, accessToken, refreshToken, sessionId }
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated successfully',
    schema: {
      type: 'object',
      properties: {
        needsProfileCompletion: { type: 'boolean' },
        user: { type: 'object' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        sessionId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired Google ID token',
  })
  async mobileGoogleSignIn(
    @Body() dto: MobileGoogleSignInDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const deviceInfo = String(req.headers['user-agent'] ?? 'Mobile Device');
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      '0.0.0.0';

    const result = await this.authService.signInWithGoogleMobile(
      dto.idToken,
      dto.role,
      dto.gradeLevel,
      {
        deviceInfo,
        ipAddress,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
      },
    );

    return this.sendSuccess(
      res,
      result,
      'Google authentication successful',
      HttpStatus.OK,
    );
  }
}
