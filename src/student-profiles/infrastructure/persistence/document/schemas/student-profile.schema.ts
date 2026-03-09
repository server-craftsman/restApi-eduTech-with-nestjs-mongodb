import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BadgeType, GradeLevel } from '../../../../../enums';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.StudentProfiles })
export class StudentProfileDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users', unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ type: String, default: null })
  gender?: string | null;

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date | null;

  @Prop({ type: String, default: null })
  schoolName?: string | null;

  @Prop({ type: String, enum: Object.values(GradeLevel), default: null })
  gradeLevel?: GradeLevel | null;

  @Prop({ type: [String], default: [] })
  preferredSubjectIds!: string[];

  @Prop({ default: false })
  onboardingCompleted!: boolean;

  @Prop({ default: 0 })
  diamondBalance!: number;

  @Prop({ default: 0 })
  xpTotal!: number;

  @Prop({ default: 0 })
  currentStreak!: number;

  /** Accumulated reward points awarded by the Simple Reward system */
  @Prop({ default: 0 })
  totalPoints!: number;

  /** Badges unlocked by crossing point thresholds — stored as $addToSet, never removed */
  @Prop({ type: [String], enum: Object.values(BadgeType), default: [] })
  badges!: BadgeType[];
}

export type StudentProfileDocumentType =
  HydratedDocument<StudentProfileDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const StudentProfileSchema = SchemaFactory.createForClass(
  StudentProfileDocument,
);
