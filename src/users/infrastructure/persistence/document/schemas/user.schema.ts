import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, EmailVerificationStatus } from '../../../../../enums';

@Schema({ timestamps: true, collection: 'users' })
export class UserDocument {
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

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type UserDocumentType = HydratedDocument<UserDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const UserSchema = SchemaFactory.createForClass(UserDocument);
