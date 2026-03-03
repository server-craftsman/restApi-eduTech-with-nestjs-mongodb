import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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
import { EmailVerificationStatus, UserRole } from '../enums';

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

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      isActive: true,
      emailVerificationStatus: EmailVerificationStatus.Pending,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Auto-create the role-specific profile on registration
    const fullName = `${dto.firstName} ${dto.lastName}`;

    if (dto.role === UserRole.Student) {
      try {
        await this.studentProfileService.createProfile({
          userId: user.id,
          fullName,
          gradeLevel: dto.gradeLevel ?? null,
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
    } else if (dto.role === UserRole.Parent) {
      try {
        await this.parentProfileService.createProfile({
          userId: user.id,
          fullName,
          phoneNumber: dto.phoneNumber ?? '',
        });
      } catch (error) {
        this.logger.warn(
          `Failed to create parent profile for ${user.email}`,
          error,
        );
      }
    } else if (dto.role === UserRole.Teacher) {
      try {
        await this.teacherProfileService.createProfile({
          userId: user.id,
          fullName,
          bio: null,
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
      dto.firstName,
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
   * Authenticates the user and persists a new session record containing the
   * hashed refresh token, device info (User-Agent) and IP address extracted
   * from the HTTP request in the controller.
   */
  async signIn(
    dto: SignInDto,
    meta: { deviceInfo: string; ipAddress: string },
  ): Promise<{
    user: User;
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
    this.logger.log(`User signed in: ${user.email} | session: ${session.id}`);
    return { user, accessToken, refreshToken, sessionId: session.id };
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
   * Creates a session for a social OAuth user (Google / Facebook) and returns
   * a full token pair — identical shape to email signIn().
   * Called by OAuth callback controllers after Passport hydrates req.user.
   */
  async signInWithOAuth(
    user: User,
    meta: { deviceInfo: string; ipAddress: string },
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
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
    this.logger.log(`OAuth sign-in: ${user.email} | session: ${session.id}`);
    return { user, accessToken, refreshToken, sessionId: session.id };
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

    const updatedUser = await this.usersService.update(user.id, {
      emailVerificationStatus: EmailVerificationStatus.Verified,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

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
    });

    this.logger.log(`Admin account created: ${adminEmail}`);
    return admin;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

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
}
