import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../../domain/user';
import { UserRepositoryAbstract } from './user.repository.abstract';
import { UserDocument, UserDocumentType } from '../schemas/user.schema';
import { UserMapper } from '../mappers/user.mapper';
import {
  UserRole,
  EmailVerificationStatus,
  ApprovalStatus,
} from '../../../../../enums';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { NOT_DELETED } from '../../../../../core/constants';

@Injectable()
export class UserRepository extends UserRepositoryAbstract {
  private readonly model: Model<UserDocumentType>;
  private readonly mapper: UserMapper;

  constructor(
    @InjectModel(UserDocument.name)
    model: Model<UserDocumentType>,
    mapper: UserMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  // ──────────────────────────────────────────────
  // READ
  // ──────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ emailVerificationToken: token, ...NOT_DELETED })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ passwordResetToken: token, ...NOT_DELETED })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAllWithFilters(
    limit = 10,
    offset = 0,
    filters?: FilterUserDto,
    sort?: SortUserDto[],
  ): Promise<[User[], number]> {
    // Build dynamic filter

    const query: Record<string, any> = {};

    // Soft-delete gate: only show deleted records when caller explicitly asks
    if (filters?.isDeleted === true) {
      query.isDeleted = true;
    } else {
      query.isDeleted = { $ne: true };
    }

    // Role filter (OR across supplied roles)
    if (filters?.roles && filters.roles.length > 0) {
      query.role = { $in: filters.roles };
    }

    // Active status filter
    if (filters?.isActive !== undefined && filters.isActive !== null) {
      query.isActive = filters.isActive;
    }

    // Email verification status filter
    if (filters?.emailVerificationStatus) {
      query.emailVerificationStatus = filters.emailVerificationStatus;
    }

    // Partial email search (case-insensitive)
    if (filters?.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }

    // Build sort — default newest first
    const sortObj: Record<string, 1 | -1> = {};
    if (sort && sort.length > 0) {
      for (const s of sort) {
        sortObj[s.orderBy as string] = s.order === 'asc' ? 1 : -1;
      }
    } else {
      sortObj.createdAt = -1;
    }

    const [docs, total] = await Promise.all([
      this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return [this.mapper.toDomainArray(docs), total];
  }

  // ──────────────────────────────────────────────
  // WRITE
  // ──────────────────────────────────────────────

  async create(user: Partial<User>): Promise<User> {
    const doc = new this.model({
      ...this.mapper.toDocument(user),
      role: user.role ?? UserRole.Student,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive ?? true,
      isDeleted: false,
      deletedAt: null,
      emailVerificationStatus:
        user.emailVerificationStatus ?? EmailVerificationStatus.Pending,
      emailVerificationToken: user.emailVerificationToken ?? null,
      emailVerificationExpires: user.emailVerificationExpires ?? null,
    });
    const saved = await doc.save();
    return this.mapper.toDomain(saved);
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: this.mapper.toDocument(user) },
        { returnDocument: 'after' },
      )
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  /** Soft-delete: sets isDeleted=true, deletedAt=now. Record is never physically removed. */
  async softDelete(id: string): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      )
      .exec();
  }

  // ──────────────────────────────────────────────
  // AGGREGATION
  // ──────────────────────────────────────────────

  async findPendingApprovals(
    limit = 10,
    offset = 0,
  ): Promise<[User[], number]> {
    const query = {
      role: { $in: [UserRole.Teacher, UserRole.Parent] },
      approvalStatus: ApprovalStatus.PendingApproval,
      ...NOT_DELETED,
    };

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return [this.mapper.toDomainArray(docs), total];
  }

  async getStatistics(): Promise<{
    total: number;
    byRole: Record<string, number>;
    active: number;
    inactive: number;
    deleted: number;
  }> {
    const [total, active, inactive, deleted, byRoleAgg] = await Promise.all([
      this.model.countDocuments({ ...NOT_DELETED }).exec(),
      this.model.countDocuments({ isActive: true, ...NOT_DELETED }).exec(),
      this.model.countDocuments({ isActive: false, ...NOT_DELETED }).exec(),
      this.model.countDocuments({ isDeleted: true }).exec(),
      this.model
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { isDeleted: { $ne: true } } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const byRole: Record<string, number> = Object.values(UserRole).reduce(
      (acc, r) => ({ ...acc, [r]: 0 }),
      {},
    );
    for (const entry of byRoleAgg) {
      byRole[entry._id] = entry.count;
    }

    return { total, byRole, active, inactive, deleted };
  }
}
