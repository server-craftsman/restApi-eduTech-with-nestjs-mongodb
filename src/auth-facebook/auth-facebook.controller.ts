import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import {
  MobileFacebookSignInDto,
  AuthResponseDto,
  CreateFacebookTestTokenDto,
} from '../auth/dto';
import { User } from '../users/domain/user';
import { BaseController } from '../core/base/base.controller';

@ApiTags('Auth - OAuth')
@Controller('auth/oauth/facebook')
export class AuthFacebookController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

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
  @ApiQuery({
    name: 'rerequest',
    required: false,
    description:
      'Set to true to force Facebook re-request consent (useful when email permission was previously denied)',
    example: 'true',
  })
  @ApiQuery({
    name: 'auth_type',
    required: false,
    description: "Optional Facebook auth_type. Example: 'rerequest'",
    example: 'rerequest',
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
    type: AuthResponseDto,
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

  // ─── Mobile OAuth Endpoint (React Native) ────────────────────────────────

  /**
   * Mobile Facebook Sign-In for React Native
   * - Client sends Facebook Access Token from react-native-fbsdk-next
   * - Backend verifies the token via Facebook Graph API
   * - Creates/returns user with JWT tokens
   * - Supports role selection for new users (Student, Teacher, Parent)
   */
  @Post('mobile-signin')
  @ApiOperation({
    summary: 'Facebook Sign-In for React Native (Mobile)',
    description: `
      **For React Native/Mobile apps only**
      
      Flow:
      1. User taps "Sign in with Facebook" in React Native app
      2. App uses @react-native-fbsdk-next/facebook-sdk to get accessToken
      3. App sends accessToken to this endpoint
      4. Backend verifies token with Facebook Graph API, creates/updates user, returns JWT tokens
      
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
    description: 'Invalid or expired Facebook access token',
  })
  async mobileFacebookSignIn(
    @Body() dto: MobileFacebookSignInDto,
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

    const result = await this.authService.signInWithFacebookMobile(
      dto.accessToken,
      dto.userId,
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
      'Facebook authentication successful',
      HttpStatus.OK,
    );
  }

  @Post('dev/test-user-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Dev] Generate Facebook test-user access token for Postman',
    description:
      'Development helper endpoint. Creates a Facebook Test User and returns a user access token that can be used to test /auth/oauth/facebook/mobile-signin from Postman.',
  })
  @ApiResponse({
    status: 200,
    description: 'Facebook test-user token generated successfully',
  })
  @ApiResponse({ status: 403, description: 'Disabled in production' })
  async generateFacebookTestUserToken(
    @Body() dto: CreateFacebookTestTokenDto,
    @Res() res: Response,
  ): Promise<Response> {
    const nodeEnv = this.configService.get<string>('nodeEnv') ?? 'development';
    if (nodeEnv === 'production') {
      return this.sendError(
        res,
        'This endpoint is disabled in production.',
        'Forbidden',
        HttpStatus.FORBIDDEN,
      );
    }

    const data = await this.authService.createFacebookTestUserToken({
      permissions: dto.permissions,
      name: dto.name,
    });

    return this.sendSuccess(
      res,
      data,
      'Facebook test token generated successfully',
      HttpStatus.OK,
    );
  }
}
