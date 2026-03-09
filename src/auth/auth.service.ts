import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { StudentProfileService } from '../student-profiles/student-profile.service';
import { ParentProfileService } from '../parent-profiles/parent-profile.service';
import { TeacherProfileService } from '../teacher-profiles/teacher-profile.service';
import { SessionService } from '../sessions/session.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '../users/domain/user';
import { EmailVerificationService } from './services/email-verification.service';
import { CompleteOAuthProfileDto } from './dto/complete-oauth-profile.dto';
import { EmailVerificationStatus, UserRole, ApprovalStatus } from '../enums';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpirationDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly studentProfileService: StudentProfileService,
    private readonly parentProfileService: ParentProfileService,
    private readonly teacherProfileService: TeacherProfileService,
    private readonly sessionService: SessionService,
  ) {
    this.refreshTokenExpirationDays =
      this.configService.get<number>('jwt.refreshExpiresInDays') ?? 7;
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async signUp(dto: SignUpDto): Promise<{ user: User; message: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate email verification token (24-hour window)
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Normalise role early so every branch below sees the same value.
    // The DTO allows role to be omitted, in which case Student is the default.
    const effectiveRole = dto.role ?? UserRole.Student;

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      role: effectiveRole,
      isActive: true,
      emailVerificationStatus: EmailVerificationStatus.Pending,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      // Only TEACHER requires approval; STUDENT and PARENT get immediate access after email verification
      approvalStatus:
        effectiveRole === UserRole.Teacher
          ? ApprovalStatus.PendingApproval
          : ApprovalStatus.NotRequired,
    });

    // Auto-create the role-specific profile on registration
    // firstName/lastName are optional for STUDENT/PARENT — fall back to email username
    const fullName =
      [dto.firstName, dto.lastName].filter(Boolean).join(' ') ||
      dto.email.split('@')[0];

    if (effectiveRole === UserRole.Student) {
      try {
        await this.studentProfileService.createProfile({
          userId: user.id,
          fullName,
          gradeLevel: dto.gradeLevel ?? null,
          preferredSubjectIds: [],
          onboardingCompleted: false,
          diamondBalance: 0,
          xpTotal: 0,
          currentStreak: 0,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to create student profile for ${user.email}`,
          error,
        );
      }
    } else if (effectiveRole === UserRole.Parent) {
      try {
        await this.parentProfileService.createProfile({
          userId: user.id,
          fullName,
          phoneNumber: dto.phoneNumber ?? '',
          relationship: dto.relationship ?? null,
          nationalIdNumber: dto.nationalIdNumber ?? null,
          nationalIdImageUrl: null,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to create parent profile for ${user.email}`,
          error,
        );
      }
    } else if (effectiveRole === UserRole.Teacher) {
      try {
        await this.teacherProfileService.createProfile({
          userId: user.id,
          fullName,
          bio: null,
          phoneNumber: null,
          subjectsTaught: dto.subjectsTaught ?? [],
          yearsOfExperience: dto.yearsOfExperience ?? null,
          educationLevel: dto.educationLevel ?? null,
          certificateUrls: [],
          cvUrl: null,
          linkedinUrl: null,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to create teacher profile for ${user.email}`,
          error,
        );
      }
    }

    // Send verification email
    await this.emailVerificationService.sendVerificationEmail(
      user.email,
      verificationToken,
      dto.firstName ?? dto.email.split('@')[0],
    );

    this.logger.log(`User registered: ${user.email} – verification email sent`);
    return {
      user,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  /**
   * Lấy thông tin user + profile tương ứng dựa trên role.
   * - Student → populate studentProfile
   * - Teacher → populate teacherProfile
   * - Parent  → populate parentProfile
   * - Admin   → không có profile (chỉ trả về user data)
   */
  private async getUserWithProfile(user: User): Promise<
    User & {
      studentProfile?: any;
      teacherProfile?: any;
      parentProfile?: any;
    }
  > {
    const result = { ...user } as User & {
      studentProfile?: any;
      teacherProfile?: any;
      parentProfile?: any;
    };

    if (user.role === UserRole.Student) {
      const profile = await this.studentProfileService.getProfileByUserId(
        user.id,
      );
      result.studentProfile = profile ?? null;
    } else if (user.role === UserRole.Teacher) {
      const profile = await this.teacherProfileService.getProfileByUserId(
        user.id,
      );
      result.teacherProfile = profile ?? null;
    } else if (user.role === UserRole.Parent) {
      const profile = await this.parentProfileService.getProfileByUserId(
        user.id,
      );
      result.parentProfile = profile ?? null;
    }
    // Admin không có profile riêng

    return result;
  }

  /**
   * Authenticates the user and persists a new session record containing the
   * hashed refresh token, device info (User-Agent) and IP address extracted
   * from the HTTP request in the controller.
   */
  async signIn(
    dto: SignInDto,
    meta: { deviceInfo: string; ipAddress: string },
  ): Promise<{
    user: User & {
      studentProfile?: any;
      teacherProfile?: any;
      parentProfile?: any;
    };
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.passwordHash) {
      throw new UnauthorizedException('User must sign up with password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new BadRequestException('Account is disabled');

    if (user.emailVerificationStatus !== EmailVerificationStatus.Verified) {
      throw new BadRequestException(
        'Please verify your email before signing in. Check your email for the verification link.',
      );
    }

    // ── Approval guard: only TEACHER accounts require admin approval ──────────
    if (user.role === UserRole.Teacher) {
      if (user.approvalStatus === ApprovalStatus.PendingApproval) {
        throw new BadRequestException(
          'Your account is awaiting admin approval. You will receive an email once a decision has been made.',
        );
      }
      if (user.approvalStatus === ApprovalStatus.Rejected) {
        throw new BadRequestException(
          `Your account application was not approved. Reason: "${user.approvalRejectionReason ?? 'No reason provided'}". ` +
            'Please update your profile and use POST /auth/resubmit-approval to resubmit for review.',
        );
      }
    }

    const { token: refreshToken, expiresAt } = this.buildRefreshToken(user.id);

    // Hash the raw refresh token before storing – never persist tokens in plaintext
    const hashedRt = await bcrypt.hash(refreshToken, 10);

    const session = await this.sessionService.createSession({
      userId: user.id,
      hashedRt,
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt,
    });

    const accessToken = this.createAccessToken(user, session.id);
    const userWithProfile = await this.getUserWithProfile(user);
    this.logger.log(`User signed in: ${user.email} | session: ${session.id}`);
    return {
      user: userWithProfile,
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  /**
   * Validates the incoming refresh token against the sessions collection,
   * then rotates it: the old hashed RT is replaced with a fresh one.
   */
  async refreshAccessToken(dto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    let userId: string;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      userId = payload.sub as string;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    // Scan all sessions for this user and find the one matching the hashed RT
    const sessions = await this.sessionService.findSessionsByUserId(userId);
    let matchedSession: (typeof sessions)[0] | null = null;

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(dto.refreshToken, session.hashedRt);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException(
        'Refresh token not found or already revoked',
      );
    }

    if (new Date() > matchedSession.expiresAt) {
      // Clean up the stale session
      await this.sessionService.deleteSession(matchedSession.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Issue new token pair
    const newAccessToken = this.createAccessToken(user, matchedSession.id);
    const { token: newRefreshToken, expiresAt } = this.buildRefreshToken(
      user.id,
    );

    // Token rotation: overwrite old hashed RT with new one in the same session row
    const newHashedRt = await bcrypt.hash(newRefreshToken, 10);
    await this.sessionService.updateSession(matchedSession.id, {
      hashedRt: newHashedRt,
      expiresAt,
    });

    this.logger.log(
      `Token rotated for user: ${user.email} | session: ${matchedSession.id}`,
    );
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: matchedSession.id,
    };
  }

  // ─── OAuth sign-in ─────────────────────────────────────────────────────────

  /**
   * Handles OAuth callback. Returns different responses based on user status:
   * - New users: completion token (user can choose role: STUDENT | TEACHER | PARENT)
   * - Returning users: immediate session with tokens (if approved)
   */
  async signInWithOAuth(
    payload: { user: User; isNew: boolean },
    meta: { deviceInfo: string; ipAddress: string },
  ): Promise<
    | { needsProfileCompletion: true; completionToken: string }
    | {
        needsProfileCompletion: false;
        user: User & {
          studentProfile?: any;
          teacherProfile?: any;
          parentProfile?: any;
        };
        accessToken: string;
        refreshToken: string;
        sessionId: string;
      }
  > {
    const { user, isNew } = payload;

    // ── Brand-new OAuth user: return completion token ──────────────────────
    // Frontend can choose role when completing profile:
    // - STUDENT: immediate tokens
    // - TEACHER/PARENT: pending approval
    if (isNew) {
      const completionToken = this.buildOAuthCompletionToken(
        user.id,
        user.email ?? user.id,
      );
      this.logger.log(
        `New OAuth user ${user.email}: awaiting profile completion`,
      );
      return { needsProfileCompletion: true, completionToken };
    }

    // ── Returning user: only TEACHER requires admin approval ─────────────────
    if (user.role === UserRole.Teacher) {
      if (user.approvalStatus === ApprovalStatus.PendingApproval) {
        throw new BadRequestException(
          'Your account is awaiting admin approval. You will receive an email once a decision has been made.',
        );
      }
      if (user.approvalStatus === ApprovalStatus.Rejected) {
        throw new BadRequestException(
          `Your account application was not approved. Reason: "${user.approvalRejectionReason ?? 'No reason provided'}". ` +
            'Please update your profile and use POST /auth/resubmit-approval to resubmit for review.',
        );
      }
    }

    const { token: refreshToken, expiresAt } = this.buildRefreshToken(user.id);
    const hashedRt = await bcrypt.hash(refreshToken, 10);
    const session = await this.sessionService.createSession({
      userId: user.id,
      hashedRt,
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt,
    });
    const accessToken = this.createAccessToken(user, session.id);
    const userWithProfile = await this.getUserWithProfile(user);
    this.logger.log(`OAuth sign-in: ${user.email} | session: ${session.id}`);
    return {
      needsProfileCompletion: false,
      user: userWithProfile,
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  /** Revoke a single session (logout one device) */
  async logout(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionService.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }
    await this.sessionService.deleteSession(sessionId);
    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
  }

  /** Revoke every active session for the user (logout from all devices) */
  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.deleteSessionsByUserId(userId);
    this.logger.log(`All sessions revoked for user ${userId}`);
  }

  // ─── Email verification ───────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string; user: User }> {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerificationStatus === EmailVerificationStatus.Verified) {
      return { message: 'Email already verified. You can sign in now.', user };
    }

    if (
      !user.emailVerificationExpires ||
      new Date() > user.emailVerificationExpires
    ) {
      throw new BadRequestException(
        'Verification token expired. Please request a new one.',
      );
    }

    // Only TEACHER requires admin approval after email verification.
    // PARENT and STUDENT get immediate access (NotRequired).
    const updatedUser = await this.usersService.update(user.id, {
      emailVerificationStatus: EmailVerificationStatus.Verified,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      approvalStatus:
        user.role === UserRole.Teacher
          ? ApprovalStatus.PendingApproval
          : ApprovalStatus.NotRequired,
    });

    // Notify TEACHER that their account is now under admin review
    if (user.role === UserRole.Teacher) {
      const firstName = user.email.split('@')[0];
      await this.emailVerificationService.sendPendingApprovalEmail(
        user.email,
        firstName,
        user.role,
      );
      this.logger.log(
        `Email verified for TEACHER ${user.email} — account pending approval`,
      );
      return {
        message:
          'Email verified successfully! Your account is now under admin review. ' +
          'You will receive an email once your application has been processed.',
        user: updatedUser,
      };
    }

    this.logger.log(`Email verified for user: ${user.email}`);
    return {
      message: 'Email verified successfully! You can now sign in.',
      user: updatedUser,
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    if (user.emailVerificationStatus === EmailVerificationStatus.Verified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await this.usersService.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.emailVerificationService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.email.split('@')[0],
    );

    this.logger.log(`Verification email resent to: ${user.email}`);
    return { message: 'Verification email sent. Please check your inbox.' };
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async createAdminAccount(): Promise<User> {
    const adminEmail = 'admin@edutech.local';
    const adminPassword = 'Admin@123456';

    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    if (existingAdmin) {
      throw new BadRequestException('Admin account already exists');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await this.usersService.create({
      email: adminEmail,
      passwordHash: hashedPassword,
      role: UserRole.Admin,
      avatarUrl: null,
      isActive: true,
      emailVerificationStatus: EmailVerificationStatus.Verified,
      approvalStatus: ApprovalStatus.NotRequired,
    });

    this.logger.log(`Admin account created: ${adminEmail}`);
    return admin;
  }

  // ─── Approval workflow (Teacher / Parent) ─────────────────────────────────

  /**
   * Returns a paginated list of Teacher/Parent users whose accounts
   * are waiting for admin review (approvalStatus = PENDING_APPROVAL).
   */
  async getPendingApprovals(
    page = 1,
    limit = 20,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [users, total] = await this.usersService.findPendingApprovals(
      limit,
      offset,
    );
    return { users, total, page, limit };
  }

  /**
   * Admin approves a Teacher/Parent account.
   * Sets approvalStatus → APPROVED and sends a confirmation email.
   */
  async approveAccount(
    userId: string,
    adminId: string,
  ): Promise<{ message: string; user: User }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    if (user.role !== UserRole.Teacher && user.role !== UserRole.Parent) {
      throw new BadRequestException(
        'Only Teacher and Parent accounts require approval',
      );
    }

    if (user.approvalStatus === ApprovalStatus.Approved) {
      throw new BadRequestException('Account is already approved');
    }

    const updated = await this.usersService.update(userId, {
      approvalStatus: ApprovalStatus.Approved,
      approvalRejectionReason: null,
      approvalReviewedAt: new Date(),
      approvalReviewedBy: adminId,
    });

    const firstName = updated.email.split('@')[0];
    await this.emailVerificationService.sendApprovalEmail(
      updated.email,
      firstName,
    );

    this.logger.log(`Account approved: ${updated.email} by admin ${adminId}`);
    return {
      message: `Account for ${updated.email} has been approved.`,
      user: updated,
    };
  }

  /**
   * Admin rejects a Teacher/Parent account with a mandatory reason.
   * Sets approvalStatus → REJECTED and notifies the user by email.
   */
  async rejectAccount(
    userId: string,
    adminId: string,
    reason: string,
  ): Promise<{ message: string; user: User }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    if (user.role !== UserRole.Teacher && user.role !== UserRole.Parent) {
      throw new BadRequestException(
        'Only Teacher and Parent accounts require approval',
      );
    }

    const updated = await this.usersService.update(userId, {
      approvalStatus: ApprovalStatus.Rejected,
      approvalRejectionReason: reason,
      approvalReviewedAt: new Date(),
      approvalReviewedBy: adminId,
    });

    const firstName = updated.email.split('@')[0];
    await this.emailVerificationService.sendRejectionEmail(
      updated.email,
      firstName,
      reason,
    );

    this.logger.log(
      `Account rejected: ${updated.email} by admin ${adminId} — reason: ${reason}`,
    );
    return {
      message: `Account for ${updated.email} has been rejected.`,
      user: updated,
    };
  }

  /**
   * Allows a rejected Teacher/Parent to update their profile and resubmit
   * for admin review.  Requires valid credentials (email + password).
   * On success, sets approvalStatus back to PENDING_APPROVAL.
   */
  async resubmitForReview(dto: {
    email: string;
    password: string;
    teacherData?: {
      subjectsTaught?: string[];
      yearsOfExperience?: number;
      educationLevel?: string;
      certificateUrls?: string[];
      cvUrl?: string;
      linkedinUrl?: string;
      phoneNumber?: string;
    };
    parentData?: {
      relationship?: string;
      nationalIdNumber?: string;
      nationalIdImageUrl?: string;
      phoneNumber?: string;
    };
  }): Promise<{ message: string; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Invalid credentials');

    if (!user.passwordHash) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    if (user.approvalStatus !== ApprovalStatus.Rejected) {
      throw new BadRequestException(
        'Resubmission is only available for rejected accounts. ' +
          `Current status: ${user.approvalStatus ?? 'none'}.`,
      );
    }

    // Update role-specific profile with new information
    if (user.role === UserRole.Teacher && dto.teacherData) {
      const profile = await this.teacherProfileService.getProfileByUserId(
        user.id,
      );
      if (profile) {
        await this.teacherProfileService.updateProfile(profile.id, {
          subjectsTaught: dto.teacherData.subjectsTaught,
          yearsOfExperience: dto.teacherData.yearsOfExperience,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          educationLevel: dto.teacherData.educationLevel as any,
          certificateUrls: dto.teacherData.certificateUrls,
          cvUrl: dto.teacherData.cvUrl,
          linkedinUrl: dto.teacherData.linkedinUrl,
          phoneNumber: dto.teacherData.phoneNumber,
        });
      }
    } else if (user.role === UserRole.Parent && dto.parentData) {
      const profile = await this.parentProfileService.getProfileByUserId(
        user.id,
      );
      if (profile) {
        await this.parentProfileService.updateProfile(profile.id, {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          relationship: dto.parentData.relationship as any,
          nationalIdNumber: dto.parentData.nationalIdNumber,
          nationalIdImageUrl: dto.parentData.nationalIdImageUrl,
          phoneNumber: dto.parentData.phoneNumber,
        });
      }
    }

    // Reset approval status to pending for new admin review
    const updated = await this.usersService.update(user.id, {
      approvalStatus: ApprovalStatus.PendingApproval,
      approvalRejectionReason: null,
      approvalReviewedAt: null,
      approvalReviewedBy: null,
    });

    const firstName = updated.email.split('@')[0];
    await this.emailVerificationService.sendPendingApprovalEmail(
      updated.email,
      firstName,
      updated.role,
    );

    this.logger.log(`Account resubmitted for review: ${updated.email}`);
    return {
      message:
        'Your updated application has been submitted for review. ' +
        'You will receive an email once a decision has been made.',
      user: updated,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Short-lived (15 min) JWT used exclusively in the OAuth two-step registration.
   * Payload carries `type: 'oauth-completion'` so it cannot be misused as an
   * access token, and `displayName` so the profile-completion step can build a
   * fullName without requiring the user to re-type their name for Student role.
   */
  private buildOAuthCompletionToken(
    userId: string,
    displayName: string,
  ): string {
    return this.jwtService.sign(
      { sub: userId, displayName, type: 'oauth-completion' },
      {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn: '15m',
      },
    );
  }

  /**
   * Step 2 of the OAuth two-step registration.
   *
   * - **STUDENT** (default): creates a student profile, opens a session, returns tokens.
   * - **TEACHER / PARENT**: creates a role profile, sets `approvalStatus = PENDING_APPROVAL`,
   *   sends a pending-approval email. No session is opened; the account must be
   *   approved by an admin before the user can sign in.
   */
  async completeOAuthProfile(
    dto: CompleteOAuthProfileDto,
    meta: { deviceInfo: string; ipAddress: string },
  ): Promise<
    | { pendingApproval: true; message: string }
    | {
        pendingApproval: false;
        user: User & { studentProfile?: any };
        accessToken: string;
        refreshToken: string;
        sessionId: string;
      }
  > {
    // ── Verify the completion token ─────────────────────────────────────────
    let tokenPayload: { sub: string; displayName: string; type: string };
    try {
      tokenPayload = this.jwtService.verify(dto.completionToken, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });
    } catch {
      throw new BadRequestException(
        'Invalid or expired completion token. Please sign in with Google/Facebook again.',
      );
    }
    if (tokenPayload.type !== 'oauth-completion') {
      throw new BadRequestException('Invalid token type.');
    }

    const userId = tokenPayload.sub;
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found.');

    const role = dto.role ?? UserRole.Student;
    // Prefer explicit name from form; fall back to OAuth displayName for Students
    const fullName =
      dto.firstName && dto.lastName
        ? `${dto.firstName} ${dto.lastName}`.trim()
        : tokenPayload.displayName;

    // ── TEACHER ─────────────────────────────────────────────────────────────
    if (role === UserRole.Teacher) {
      await this.usersService.update(user.id, {
        role: UserRole.Teacher,
        approvalStatus: ApprovalStatus.PendingApproval,
      });
      await this.teacherProfileService.createProfile({
        userId: user.id,
        fullName,
        bio: null,
        phoneNumber: null,
        subjectsTaught: dto.subjectsTaught ?? [],
        yearsOfExperience: dto.yearsOfExperience ?? null,
        educationLevel: dto.educationLevel ?? null,
        certificateUrls: [],
        cvUrl: null,
        linkedinUrl: null,
      });
      await this.emailVerificationService.sendPendingApprovalEmail(
        user.email,
        fullName,
        UserRole.Teacher,
      );
      this.logger.log(
        `OAuth teacher profile submitted for approval: ${user.email}`,
      );
      return {
        pendingApproval: true,
        message:
          'Your teacher profile has been submitted for admin review. ' +
          'You will receive an email once a decision has been made.',
      };
    }

    // ── PARENT — no approval needed, create session immediately ────────────
    if (role === UserRole.Parent) {
      await this.usersService.update(user.id, {
        role: UserRole.Parent,
        approvalStatus: ApprovalStatus.NotRequired,
      });
      try {
        await this.parentProfileService.createProfile({
          userId: user.id,
          fullName,
          phoneNumber: dto.phoneNumber ?? '',
          relationship: dto.relationship ?? null,
          nationalIdNumber: dto.nationalIdNumber ?? null,
          nationalIdImageUrl: null,
        });
      } catch (err) {
        this.logger.warn(
          `Failed to create parent profile for ${user.email}`,
          err,
        );
      }
      const updatedParentUser = (await this.usersService.findById(
        user.id,
      )) as User;
      const { token: parentRt, expiresAt: parentRtExp } =
        this.buildRefreshToken(updatedParentUser.id);
      const hashedParentRt = await bcrypt.hash(parentRt, 10);
      const parentSession = await this.sessionService.createSession({
        userId: updatedParentUser.id,
        hashedRt: hashedParentRt,
        deviceInfo: meta.deviceInfo,
        ipAddress: meta.ipAddress,
        expiresAt: parentRtExp,
      });
      const parentAccessToken = this.createAccessToken(
        updatedParentUser,
        parentSession.id,
      );
      const parentWithProfile =
        await this.getUserWithProfile(updatedParentUser);
      this.logger.log(
        `OAuth parent profile completed, session created: ${updatedParentUser.email} | ${parentSession.id}`,
      );
      return {
        pendingApproval: false,
        user: parentWithProfile,
        accessToken: parentAccessToken,
        refreshToken: parentRt,
        sessionId: parentSession.id,
      };
    }

    // ── STUDENT (default) — create profile + open session immediately ────────
    try {
      await this.studentProfileService.createProfile({
        userId: user.id,
        fullName,
        gradeLevel: null,
        preferredSubjectIds: [],
        onboardingCompleted: false,
        diamondBalance: 0,
        xpTotal: 0,
        currentStreak: 0,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to create student profile for ${user.email}`,
        err,
      );
    }

    const updatedUser = (await this.usersService.findById(user.id)) as User;
    const { token: refreshToken, expiresAt } = this.buildRefreshToken(
      updatedUser.id,
    );
    const hashedRt = await bcrypt.hash(refreshToken, 10);
    const session = await this.sessionService.createSession({
      userId: updatedUser.id,
      hashedRt,
      deviceInfo: meta.deviceInfo,
      ipAddress: meta.ipAddress,
      expiresAt,
    });
    const accessToken = this.createAccessToken(updatedUser, session.id);
    const userWithProfile = await this.getUserWithProfile(updatedUser);
    this.logger.log(
      `OAuth student profile completed, session created: ${updatedUser.email} | ${session.id}`,
    );
    return {
      pendingApproval: false,
      user: userWithProfile,
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  createAccessToken(user: User, sessionId: string): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId, // embedded so JwtStrategy can validate session on every request
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>('jwt.expiresIn'),
      secret: this.configService.getOrThrow<string>('jwt.secret'),
    } as any);
  }

  /**
   * Generates a signed JWT refresh token and returns both the raw token string
   * and its expiry Date so the caller can persist them in the sessions collection.
   */
  private buildRefreshToken(userId: string): {
    token: string;
    expiresAt: Date;
  } {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpirationDays);

    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });

    return { token, expiresAt };
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  // ─── Password reset (Security & Recovery Flow) ────────────────────────────

  /**
   * Step 1 — Forgot password:
   * Generates a 6-digit OTP valid for 10 minutes and sends it to the
   * registered email address. Always returns the same response regardless of
   * whether the email exists (prevents user enumeration).
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const SAFE_MESSAGE =
      'If this email is registered, a 6-digit OTP has been sent. Check your inbox.';

    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: SAFE_MESSAGE };

    const otp = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.usersService.update(user.id, {
      passwordResetOtp: otp,
      passwordResetToken: null, // invalidate any previous reset token
      passwordResetExpires: expires,
    });

    await this.emailVerificationService.sendPasswordResetOtp(user.email, otp);
    this.logger.log(`Password reset OTP dispatched → ${user.email}`);
    return { message: SAFE_MESSAGE };
  }

  /**
   * Step 2 — Verify OTP:
   * Validates the 6-digit OTP against the stored value and expiry.
   * On success, consumes the OTP and returns a one-time reset token valid
   * for 60 minutes that the client must send in Step 3.
   */
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ resetToken: string; message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.passwordResetOtp || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (user.passwordResetOtp !== otp) {
      throw new BadRequestException('Incorrect OTP. Please try again.');
    }

    // Consume the OTP and issue a one-time reset token (60 min window)
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await this.usersService.update(user.id, {
      passwordResetOtp: null,
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    this.logger.log(`OTP verified for ${user.email} — reset token issued`);
    return {
      resetToken,
      message:
        'OTP verified. Use the reset token to set a new password within 60 minutes.',
    };
  }

  /**
   * Change password for authenticated user (requires current password verification).
   * Hashes the new password, updates it, and revokes all active sessions for security.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'User account does not have a password set',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(userId, {
      passwordHash: hashedPassword,
    });

    // Revoke all active sessions for security (force re-authentication on all devices)
    await this.sessionService.deleteSessionsByUserId(userId);

    this.logger.log(
      `Password changed for ${user.email} — all sessions revoked.`,
    );
    return {
      message:
        'Password changed successfully. All devices have been signed out. Please sign in with your new password.',
    };
  }

  /**
   * Step 3 — Reset password:
   * Validates the reset token, updates the password hash, clears all reset
   * fields, and revokes every active session so old devices are forced to
   * re-authenticate (Step 4 — re-sync).
   */
  async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetToken(resetToken);

    if (!user || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException(
        'Reset token has expired. Please request a new OTP.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(user.id, {
      passwordHash: hashedPassword,
      passwordResetOtp: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    // Step 4 — Re-sync: revoke all active sessions on every device
    await this.sessionService.deleteSessionsByUserId(user.id);

    this.logger.log(
      `Password reset for ${user.email} — all sessions revoked (re-sync).`,
    );
    return {
      message:
        'Password reset successfully. All devices have been signed out. Please sign in with your new password.',
    };
  }
}
