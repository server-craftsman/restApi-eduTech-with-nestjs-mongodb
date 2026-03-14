import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './domain/user';
import { UserRepositoryAbstract } from './infrastructure/persistence/document/repositories/user.repository.abstract';
import { UserRole, EmailVerificationStatus, ApprovalStatus } from '../enums';
import { BaseService } from '../core/base/base.service';
import { CloudinaryAsset } from '../core/interfaces';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { TeacherProfileService } from '../teacher-profiles/teacher-profile.service';
import { ParentProfileService } from '../parent-profiles/parent-profile.service';

@Injectable()
export class UsersService extends BaseService {
  constructor(
    private readonly userRepository: UserRepositoryAbstract,
    private readonly teacherProfileService: TeacherProfileService,
    private readonly parentProfileService: ParentProfileService,
  ) {
    super();
  }

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  async create(dto: CreateUserDto | Record<string, unknown>): Promise<User> {
    const typedDto = dto as Partial<CreateUserDto> & Record<string, unknown>;

    const createData: any = {
      email: typedDto.email as string,
      passwordHash:
        (typedDto.passwordHash as string | undefined) || typedDto.password,
      role: typedDto.role ?? UserRole.Student,
      avatarUrl: (typedDto.avatarUrl as string | null | undefined) ?? null,
      isActive: typedDto.isActive ?? true,
      emailVerificationToken: typedDto.emailVerificationToken,
      emailVerificationExpires: typedDto.emailVerificationExpires,
    };

    const verificationStatus = typedDto.emailVerificationStatus as
      | string
      | undefined;
    if (verificationStatus) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      createData.emailVerificationStatus = verificationStatus;
    }

    if (typedDto.approvalStatus !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      createData.approvalStatus = typedDto.approvalStatus;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userRepository.create(createData);
  }

  /**
   * Admin-only creation: hashes password, marks email as Verified,
   * auto-approves Teacher, and creates the role-specific profile.
   * PARENT accounts do NOT require approval (same as STUDENT).
   */
  async adminCreate(dto: CreateUserDto): Promise<User> {
    const hash = await bcrypt.hash(dto.password, 10);
    const role = dto.role ?? UserRole.Student;

    // Admin-created accounts bypass email verification.
    // Only TEACHER requires approval; PARENT and STUDENT are NotRequired.
    const approvalStatus =
      role === UserRole.Teacher
        ? ApprovalStatus.Approved
        : ApprovalStatus.NotRequired;

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash: hash,
      role,
      avatarUrl: null,
      isActive: true,
      emailVerificationStatus: EmailVerificationStatus.Verified,
      approvalStatus,
      isDeleted: false,
      deletedAt: null,
    });

    // Create role profile so downstream queries always find a profile
    const fullName = `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim();

    if (role === UserRole.Teacher) {
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
    } else if (role === UserRole.Parent) {
      await this.parentProfileService.createProfile({
        userId: user.id,
        fullName,
        phoneNumber: dto.phoneNumber ?? '',
        relationship: dto.relationship ?? null,
        nationalIdNumber: dto.nationalIdNumber ?? null,
        nationalIdImageUrl: null,
      });
    }

    return user;
  }

  // ──────────────────────────────────────────────
  // READ
  // ──────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findByVerificationToken(token);
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findByPasswordResetToken(token);
  }

  async findPendingApprovals(
    limit: number,
    offset: number,
  ): Promise<[User[], number]> {
    return this.userRepository.findPendingApprovals(limit, offset);
  }

  async findAll(
    query: QueryUserDto,
  ): Promise<InfinityPaginationResponseDto<User>> {
    const limit = query.limit ?? 10;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    const [users] = await this.userRepository.findAllWithFilters(
      limit,
      offset,
      query.filters ?? undefined,
      query.sort ?? undefined,
    );

    return infinityPagination(users, { page, limit });
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const updated = await this.userRepository.update(id, dto);
    if (!updated) throw new Error(`User with id ${id} not found`);
    return updated;
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error(`User with id ${id} not found`);
    return this.userRepository.update(id, { isActive }) as Promise<User>;
  }

  async updateAvatar(id: string, avatarUrl: CloudinaryAsset): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error(`User with id ${id} not found`);
    return this.userRepository.update(id, { avatarUrl }) as Promise<User>;
  }

  // ──────────────────────────────────────────────
  // TEACHER APPROVAL
  // ──────────────────────────────────────────────

  /**
   * Admin approves a pending teacher account.
   * Sets approvalStatus=Approved, activates the account,
   * records who reviewed it and when.
   */
  async approveTeacher(adminId: string, userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (user.role !== UserRole.Teacher)
      throw new BadRequestException('User is not a Teacher');
    if (user.approvalStatus !== ApprovalStatus.PendingApproval)
      throw new BadRequestException(
        'Teacher account is not in PendingApproval state',
      );
    const updated = await this.userRepository.update(userId, {
      approvalStatus: ApprovalStatus.Approved,
      approvalReviewedAt: new Date(),
      approvalReviewedBy: adminId,
      approvalRejectionReason: null,
      isActive: true,
    });
    if (!updated) throw new Error('Failed to update user');
    return updated;
  }

  /**
   * Admin rejects a teacher account (Pending or already Approved).
   * Sets approvalStatus=Rejected, deactivates account, stores reason.
   */
  async rejectTeacher(
    adminId: string,
    userId: string,
    reason: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (user.role !== UserRole.Teacher)
      throw new BadRequestException('User is not a Teacher');
    const updated = await this.userRepository.update(userId, {
      approvalStatus: ApprovalStatus.Rejected,
      approvalRejectionReason: reason,
      approvalReviewedAt: new Date(),
      approvalReviewedBy: adminId,
      isActive: false,
    });
    if (!updated) throw new Error('Failed to update user');
    return updated;
  }

  // ──────────────────────────────────────────────
  // DELETE (soft)
  // ──────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    return this.userRepository.softDelete(id);
  }

  // ──────────────────────────────────────────────
  // SOCIAL AUTH
  // ──────────────────────────────────────────────

  async upsertSocialUser(payload: {
    provider: string;
    providerId: string;
    email?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  }): Promise<{ user: User; isNew: boolean }> {
    if (payload.email) {
      const existing = await this.findByEmail(payload.email);
      if (existing) {
        if (payload.avatarUrl && !existing.avatarUrl) {
          await this.userRepository.update(existing.id, {
            avatarUrl: payload.avatarUrl,
            isActive: true,
          });
          return {
            user: (await this.findById(existing.id)) as User,
            isNew: false,
          };
        }
        return { user: existing, isNew: false };
      }
    }

    // OAuth provider already verified the email.
    // New users start as Student + Verified; role can be upgraded in /auth/oauth/complete-profile.
    const user = await this.userRepository.create({
      email: payload.email ?? `${payload.providerId}@${payload.provider}.local`,
      passwordHash: null,
      role: UserRole.Student,
      avatarUrl: payload.avatarUrl ?? null,
      isActive: true,
      emailVerificationStatus: EmailVerificationStatus.Verified,
      approvalStatus: ApprovalStatus.NotRequired,
    });
    return { user, isNew: true };
  }

  // ──────────────────────────────────────────────
  // ADMIN AGGREGATION
  // ──────────────────────────────────────────────

  async getStatistics(): Promise<{
    total: number;
    byRole: Record<string, number>;
    active: number;
    inactive: number;
    deleted: number;
  }> {
    return this.userRepository.getStatistics();
  }
}
