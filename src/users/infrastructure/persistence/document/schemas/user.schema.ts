import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  UserRole,
  EmailVerificationStatus,
  ApprovalStatus,
} from '../../../../../enums';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Users })
export class UserDocument extends BaseSchemaFields {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, default: null })
  passwordHash?: string | null;

  @Prop({ enum: UserRole, default: UserRole.Student })
  role!: UserRole;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({
    enum: EmailVerificationStatus,
    default: EmailVerificationStatus.Pending,
  })
  emailVerificationStatus!: EmailVerificationStatus;

  @Prop({ type: String, default: null })
  emailVerificationToken?: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationExpires?: Date | null;

  @Prop({ type: String, default: null })
  passwordResetOtp?: string | null;

  @Prop({ type: String, default: null })
  passwordResetToken?: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpires?: Date | null;

  // ── Approval workflow (Teacher / Parent accounts) ──────────────────────────
  @Prop({ type: String, enum: ApprovalStatus, default: null })
  approvalStatus?: ApprovalStatus | null;

  @Prop({ type: String, default: null })
  approvalRejectionReason?: string | null;

  @Prop({ type: Date, default: null })
  approvalReviewedAt?: Date | null;

  /** MongoDB ObjectId string of the admin who performed the last review. */
  @Prop({ type: String, default: null })
  approvalReviewedBy?: string | null;

}

export type UserDocumentType = HydratedDocument<UserDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const UserSchema = SchemaFactory.createForClass(UserDocument);
