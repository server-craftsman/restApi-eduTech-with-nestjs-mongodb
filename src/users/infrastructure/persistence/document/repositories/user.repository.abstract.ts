import { User } from '../../../../domain/user';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';

export abstract class UserRepositoryAbstract {
  abstract findById(id: string): Promise<User | null>;
  abstract findAllWithFilters(
    limit: number,
    offset: number,
    filters?: FilterUserDto,
    sort?: SortUserDto[],
  ): Promise<[User[], number]>;
  abstract create(user: Partial<User>): Promise<User>;
  abstract update(id: string, user: Partial<User>): Promise<User | null>;
  abstract softDelete(id: string): Promise<void>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByVerificationToken(token: string): Promise<User | null>;
  abstract findByPasswordResetToken(token: string): Promise<User | null>;
  /** Returns [Teacher|Parent users with approvalStatus=PENDING_APPROVAL, total count] */
  abstract findPendingApprovals(
    limit: number,
    offset: number,
  ): Promise<[User[], number]>;
  abstract getStatistics(): Promise<{
    total: number;
    byRole: Record<string, number>;
    active: number;
    inactive: number;
    deleted: number;
  }>;
}
