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
  ApiQuery,
  ApiExtraModels,
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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApproveAccountDto } from './dto/approve-account.dto';
import { RejectAccountDto } from './dto/reject-account.dto';
import { ResubmitApprovalDto } from './dto/resubmit-approval.dto';
import { CompleteOAuthProfileDto } from './dto/complete-oauth-profile.dto';
import { User } from '../users/domain/user';

@ApiTags('Auth')
@Controller('auth')
@ApiExtraModels(
  ApproveAccountDto,
  RejectAccountDto,
  ResubmitApprovalDto,
  CompleteOAuthProfileDto,
)
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

  // ─── Password reset (Security & Recovery Flow) ──────────────────────────

  /**
   * Step 1 — Forgot password
   * Sends a 6-digit OTP to the user's registered email.
   */
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Step 1 — Forgot password: send OTP to registered email',
    description:
      'Generates a 6-digit OTP valid for **10 minutes** and dispatches it to the ' +
      'registered email address. The response is always identical regardless of ' +
      'whether the email exists (prevents user enumeration).',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent (or email not found — same response)',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.forgotPassword(dto.email);
    return this.sendSuccess(res, {}, result.message, HttpStatus.OK);
  }

  /**
   * Step 2 — Verify OTP
   * Validates the 6-digit OTP and issues a one-time reset token.
   */
  @Post('password/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Step 2 — Verify OTP: exchange OTP for a reset token',
    description:
      'Validates the 6-digit OTP from Step 1. On success, returns a **reset token** ' +
      'valid for **60 minutes** that must be supplied in Step 3. The OTP is consumed ' +
      'immediately and cannot be reused.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP valid — reset token returned',
    schema: { properties: { resetToken: { type: 'string' } } },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid, incorrect, or expired OTP',
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.verifyOtp(dto.email, dto.otp);
    return this.sendSuccess(
      res,
      { resetToken: result.resetToken },
      result.message,
      HttpStatus.OK,
    );
  }

  /**
   * Step 3 — Reset password
   * Sets the new password and revokes all active sessions (Step 4 re-sync).
   */
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Step 3 — Reset password: set new password, sign out all devices',
    description:
      'Validates the reset token from Step 2, updates the password hash, and ' +
      '**revokes every active session** across all devices (Step 4 — re-sync). ' +
      'The user must sign in again with the new password.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated. All sessions revoked.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.resetPassword(
      dto.resetToken,
      dto.newPassword,
    );
    return this.sendSuccess(res, {}, result.message, HttpStatus.OK);
  }

  // ─── Change password (Authenticated users only) ────────────────────────

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password for authenticated user',
    description:
      'Allows authenticated users to change their password by providing the current password ' +
      'and the new password. Requires valid access token. ' +
      '**All active sessions will be revoked after password change** (re-sync across all devices).',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully. All sessions revoked.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or current password is incorrect',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid request',
  })
  async changePassword(
    @Req() req: Request & { user: User },
    @Body() dto: ChangePasswordDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return this.sendSuccess(res, {}, result.message, HttpStatus.OK);
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

  // ─── Approval workflow — Admin endpoints ──────────────────────────────────

  /**
   * GET /auth/admin/pending-approvals
   * Returns paginated list of Teacher/Parent accounts awaiting review.
   */
  @Get('admin/pending-approvals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List accounts pending admin approval (Admin only)',
    description:
      'Returns Teacher and Parent accounts whose email has been verified ' +
      'but whose account has not yet been approved or rejected. ' +
      'Ordered oldest-first (FIFO review queue).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Pending-approval accounts listed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPendingApprovals(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.getPendingApprovals(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return this.sendSuccess(
      res,
      result,
      'Pending approvals retrieved successfully',
      HttpStatus.OK,
    );
  }

  /**
   * POST /auth/admin/approve
   * Admin approves a Teacher/Parent account → user can now log in.
   */
  @Post('admin/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve a Teacher/Parent account (Admin only)',
    description:
      'Sets the account status to APPROVED and sends a confirmation email. ' +
      'The user can log in immediately after approval.',
  })
  @ApiBody({ type: ApproveAccountDto })
  @ApiResponse({ status: 200, description: 'Account approved' })
  @ApiResponse({
    status: 400,
    description: 'User not found or already approved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async approveAccount(
    @Body() dto: ApproveAccountDto,
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.approveAccount(
      dto.userId,
      req.user.id,
    );
    return this.sendSuccess(
      res,
      { user: result.user },
      result.message,
      HttpStatus.OK,
    );
  }

  /**
   * POST /auth/admin/reject
   * Admin rejects a Teacher/Parent account with a mandatory reason.
   */
  @Post('admin/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject a Teacher/Parent account (Admin only)',
    description:
      'Sets the account status to REJECTED, stores the rejection reason, ' +
      'and sends a notification email with the reason and instructions for resubmission.',
  })
  @ApiBody({ type: RejectAccountDto })
  @ApiResponse({ status: 200, description: 'Account rejected' })
  @ApiResponse({ status: 400, description: 'User not found or invalid role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rejectAccount(
    @Body() dto: RejectAccountDto,
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.rejectAccount(
      dto.userId,
      req.user.id,
      dto.reason,
    );
    return this.sendSuccess(
      res,
      { user: result.user },
      result.message,
      HttpStatus.OK,
    );
  }

  // ─── Approval workflow — User resubmission ────────────────────────────────

  /**
   * POST /auth/resubmit-approval
   * Allows a REJECTED Teacher/Parent to update their profile data and
   * re-submit the application for admin review.
   */
  @Post('resubmit-approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resubmit application after rejection (Teacher/Parent only)',
    description:
      'Available only for accounts with approvalStatus = REJECTED. ' +
      'Authenticate with email + password, then provide updated profile data. ' +
      'On success, resets the status to PENDING_APPROVAL and notifies the admin team.',
  })
  @ApiBody({ type: ResubmitApprovalDto })
  @ApiResponse({
    status: 200,
    description: 'Application resubmitted for review',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid credentials, wrong role, or account not in REJECTED state',
  })
  async resubmitForReview(
    @Body() dto: ResubmitApprovalDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.authService.resubmitForReview({
      email: dto.email,
      password: dto.password,
      teacherData: dto.teacherData,
      parentData: dto.parentData,
    });
    return this.sendSuccess(
      res,
      { user: result.user },
      result.message,
      HttpStatus.OK,
    );
  }

  // ─── OAuth two-step registration — complete profile ───────────────────────

  /**
   * POST /auth/oauth/complete-profile
   *
   * Called after a Google / Facebook OAuth callback responds with
   * `{ needsProfileCompletion: true, completionToken }`.
   *
   * - **STUDENT** (default / no role): creates student profile, returns full tokens.
   * - **TEACHER**: creates teacher profile → `approvalStatus = PENDING_APPROVAL`.
   * - **PARENT**: creates parent profile → `approvalStatus = PENDING_APPROVAL`.
   *
   * Teacher/Parent receive a pending-approval email and must wait for admin review
   * before they can sign in.
   */
  @Post('oauth/complete-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete OAuth profile after first Google/Facebook login',
    description:
      'Use the completionToken from the OAuth callback to set your role and provide ' +
      'role-specific fields. Student role returns tokens immediately. ' +
      'Teacher/Parent roles enter pending-approval state.',
  })
  @ApiBody({ type: CompleteOAuthProfileDto })
  @ApiResponse({
    status: 200,
    description:
      'Student: returns tokens. Teacher/Parent: returns pendingApproval=true message.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid/expired completionToken or validation error',
  })
  async completeOAuthProfile(
    @Body() dto: CompleteOAuthProfileDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const deviceInfo = String(req.headers['user-agent'] ?? 'Unknown Device');
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      '0.0.0.0';

    const result = await this.authService.completeOAuthProfile(dto, {
      deviceInfo,
      ipAddress,
    });

    if (result.pendingApproval) {
      return this.sendSuccess(res, null, result.message, HttpStatus.OK);
    }
    return this.sendSuccess(
      res,
      result,
      'Profile completed successfully',
      HttpStatus.OK,
    );
  }
}
