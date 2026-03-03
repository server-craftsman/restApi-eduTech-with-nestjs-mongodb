import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './domain/user';
import { UserRepositoryAbstract } from './infrastructure/persistence/document/repositories/user.repository.abstract';
import { UserRole } from '../enums';
import { BaseService } from '../core/base/base.service';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';

@Injectable()
export class UsersService extends BaseService {
  constructor(private readonly userRepository: UserRepositoryAbstract) {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userRepository.create(createData);
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
  }): Promise<User> {
    if (payload.email) {
      const existing = await this.findByEmail(payload.email);
      if (existing) {
        if (payload.avatarUrl && !existing.avatarUrl) {
          await this.userRepository.update(existing.id, {
            avatarUrl: payload.avatarUrl,
            isActive: true,
          });
          return (await this.findById(existing.id)) as User;
        }
        return existing;
      }
    }

    return this.userRepository.create({
      email: payload.email ?? `${payload.providerId}@${payload.provider}.local`,
      passwordHash: null,
      role: UserRole.Student,
      avatarUrl: payload.avatarUrl ?? null,
      isActive: true,
    });
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
