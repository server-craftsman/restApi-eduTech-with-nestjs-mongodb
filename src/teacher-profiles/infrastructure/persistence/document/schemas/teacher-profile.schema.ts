import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TeacherEducationLevel } from '../../../../../enums';

@Schema({ timestamps: true, collection: 'teacher_profiles' })
export class TeacherProfileDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users', unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ type: String, default: null })
  bio?: string | null;

  // ── Approval-review fields ─────────────────────────────────────────────────
  @Prop({ type: String, default: null })
  phoneNumber?: string | null;

  @Prop({ type: [String], default: [] })
  subjectsTaught?: string[];

  @Prop({ type: Number, default: null })
  yearsOfExperience?: number | null;

  @Prop({ type: String, enum: TeacherEducationLevel, default: null })
  educationLevel?: TeacherEducationLevel | null;

  @Prop({ type: [String], default: [] })
  certificateUrls?: string[];

  @Prop({ type: String, default: null })
  cvUrl?: string | null;

  @Prop({ type: String, default: null })
  linkedinUrl?: string | null;
}

export type TeacherProfileDocumentType =
  HydratedDocument<TeacherProfileDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const TeacherProfileSchema = SchemaFactory.createForClass(
  TeacherProfileDocument,
);
