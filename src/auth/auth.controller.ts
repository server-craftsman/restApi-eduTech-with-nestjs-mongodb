import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  Req,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../users/domain/user';

@ApiTags('Auth')
@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  @Post('email/register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates the user account and automatically creates the role-specific profile ' +
      '(student_profiles / parent_profiles / teacher_profiles). ' +
      'A verification email is sent immediately after registration.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered. Verification email sent to inbox.',
  })
  @ApiResponse({
    status: 400,
    description: 'User already exists or validation error',
  })
  async register(
    @Body() dto: SignUpDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { user, message } = await this.authService.signUp(dto);
    return this.sendSuccess(
      res,
      { user: { id: user.id, email: user.email, role: user.role } },
      message,
      HttpStatus.CREATED,
    );
  }

  // ─── Email verification ───────────────────────────────────────────────────

  @Get('email/verify')
  @ApiOperation({
    summary: 'Verify email via token link (browser redirect endpoint)',
    description:
      'Clicked from the email. Renders email-verified.hbs or verification-error.hbs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified – renders email-verified.hbs',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid/expired token – renders verification-error.hbs',
  })
  async verifyEmail(
    @Query() dto: VerifyEmailDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.authService.verifyEmail(dto.token);
      return res.render('email-verified', {
        message: result.message,
        email: result.user.email,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return res.render('verification-error', { message: errorMessage });
    }
  }

  @Post('email/resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({
    status: 400,
    description: 'Email already verified or user not found',
  })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.resendVerificationEmail(dto.email);
    return this.sendSuccess(res, {}, result.message, HttpStatus.OK);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates the user and creates a session record in the database. ' +
      'The session stores: hashed refresh token, device info (User-Agent header) ' +
      'and IP address (X-Forwarded-For or socket.remoteAddress). ' +
      'Returns accessToken (short-lived JWT), refreshToken (long-lived JWT) and sessionId.',
  })
  @ApiResponse({
    status: 200,
    type: AuthResponseDto,
    description:
      'Login successful. Use accessToken in Authorization: Bearer header.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Email not verified' })
  async login(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    // ── Device fingerprinting ──────────────────────────────────────────────
    // User-Agent is the browser/OS string sent by every HTTP client
    const deviceInfo = req.headers['user-agent'] ?? 'Unknown Device';

    // X-Forwarded-For is set by load-balancers / reverse proxies (Nginx, etc.)
    // Fall back to the direct socket address for local/dev environments
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      '0.0.0.0';

    const { user, accessToken, refreshToken, sessionId } =
      await this.authService.signIn(dto, { deviceInfo, ipAddress });

    return this.sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        sessionId,
        user: { id: user.id, email: user.email, role: user.role },
      },
      'Login successful',
      HttpStatus.OK,
    );
  }

  // ─── Token refresh ────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiOperation({
    summary: 'Rotate refresh token',
    description:
      'Validates the current refresh token against the sessions collection ' +
      'and performs token rotation: the old hashed RT is overwritten with a new one. ' +
      'This prevents replay attacks – each refresh token is single-use.',
  })
  @ApiResponse({
    status: 200,
    description:
      'New access token and refresh token generated. Previous refresh token revoked.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired or already-revoked refresh token',
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res() res: Response,
  ): Promise<Response> {
    const tokens = await this.authService.refreshAccessToken(dto);
    return this.sendSuccess(
      res,
      tokens,
      'Token refreshed successfully',
      HttpStatus.OK,
    );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout – revoke a specific session',
    description:
      'Provide sessionId in the body to revoke that specific session (single-device logout). ' +
      'Omit sessionId to revoke all sessions (all-device logout). Requires valid access token.',
  })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiResponse({ status: 200, description: 'Session(s) revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Req() req: Request & { user: User },
    @Body() dto: LogoutDto,
    @Res() res: Response,
  ): Promise<Response> {
    if (dto.sessionId) {
      await this.authService.logout(dto.sessionId, req.user.id);
      return this.sendSuccess(
        res,
        {},
        'Session revoked successfully',
        HttpStatus.OK,
      );
    }
    await this.authService.logoutAll(req.user.id);
    return this.sendSuccess(
      res,
      {},
      'Logged out from all devices',
      HttpStatus.OK,
    );
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revokes every active session for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<Response> {
    await this.authService.logoutAll(req.user.id);
    return this.sendSuccess(
      res,
      {},
      'Logged out from all devices',
      HttpStatus.OK,
    );
  }

  // ─── Admin helpers ────────────────────────────────────────────────────────

  @Post('/migrate/users')
  @ApiOperation({
    summary: '[Dev] Seed admin account (do not use in production)',
  })
  @ApiResponse({ status: 201, description: 'Admin account created' })
  @ApiResponse({ status: 400, description: 'Admin account already exists' })
  async createAdmin(@Res() res: Response): Promise<Response> {
    const admin = await this.authService.createAdminAccount();
    return this.sendSuccess(
      res,
      { user: { id: admin.id, email: admin.email, role: admin.role } },
      'Admin account created successfully',
      HttpStatus.CREATED,
    );
  }
}
