import { Injectable } from '@nestjs/common';
import { User } from '../../../../domain/user';
import { UserDocument, UserDocumentType } from '../schemas/user.schema';
import { UserRole, EmailVerificationStatus } from '../../../../../enums';

@Injectable()
export class UserMapper {
  toDomain(doc: UserDocumentType): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash ?? null,
      role: doc.role ?? UserRole.Student,
      avatarUrl: doc.avatarUrl ?? null,
      isActive: doc.isActive,
      emailVerificationStatus:
        doc.emailVerificationStatus ?? EmailVerificationStatus.Pending,
      emailVerificationToken: doc.emailVerificationToken ?? null,
      emailVerificationExpires: doc.emailVerificationExpires ?? null,
      passwordResetOtp: doc.passwordResetOtp ?? null,
      passwordResetToken: doc.passwordResetToken ?? null,
      passwordResetExpires: doc.passwordResetExpires ?? null,
      approvalStatus: doc.approvalStatus ?? null,
      approvalRejectionReason: doc.approvalRejectionReason ?? null,
      approvalReviewedAt: doc.approvalReviewedAt ?? null,
      approvalReviewedBy: doc.approvalReviewedBy ?? null,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: UserDocumentType[]): User[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(user: Partial<User>): Partial<UserDocument> {
    const doc: Record<string, unknown> = {};

    if (user.email !== undefined) doc.email = user.email;
    if (user.passwordHash !== undefined) doc.passwordHash = user.passwordHash;
    if (user.role !== undefined) doc.role = user.role;
    if (user.avatarUrl !== undefined) doc.avatarUrl = user.avatarUrl;
    if (user.isActive !== undefined) doc.isActive = user.isActive;
    if (user.emailVerificationStatus !== undefined)
      doc.emailVerificationStatus = user.emailVerificationStatus;
    if (user.emailVerificationToken !== undefined)
      doc.emailVerificationToken = user.emailVerificationToken;
    if (user.emailVerificationExpires !== undefined)
      doc.emailVerificationExpires = user.emailVerificationExpires;
    if (user.passwordResetOtp !== undefined)
      doc.passwordResetOtp = user.passwordResetOtp;
    if (user.passwordResetToken !== undefined)
      doc.passwordResetToken = user.passwordResetToken;
    if (user.passwordResetExpires !== undefined)
      doc.passwordResetExpires = user.passwordResetExpires;
    if (user.approvalStatus !== undefined)
      doc.approvalStatus = user.approvalStatus;
    if (user.approvalRejectionReason !== undefined)
      doc.approvalRejectionReason = user.approvalRejectionReason;
    if (user.approvalReviewedAt !== undefined)
      doc.approvalReviewedAt = user.approvalReviewedAt;
    if (user.approvalReviewedBy !== undefined)
      doc.approvalReviewedBy = user.approvalReviewedBy;
    if (user.isDeleted !== undefined) doc.isDeleted = user.isDeleted;
    if (user.deletedAt !== undefined) doc.deletedAt = user.deletedAt;

    return doc as Partial<UserDocument>;
  }
}
