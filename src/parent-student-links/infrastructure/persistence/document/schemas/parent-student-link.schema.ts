import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: false, collection: 'parent_student_links' })
export class ParentStudentLinkDocument {
  /** Null until the parent connects via connectByCode (Step 2). */
  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'parent_profiles',
    default: null,
  })
  parentId?: Types.ObjectId | null;

  @Prop({ required: true, type: Types.ObjectId, ref: 'student_profiles' })
  studentId!: Types.ObjectId;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ type: String, default: null })
  linkCode?: string | null;

  @Prop({ type: Date, default: null })
  linkCodeExpires?: Date | null;

  /** Tracks when the last automated progress report was sent so cron logic can throttle correctly. */
  @Prop({ type: Date, default: null })
  lastReportSentAt?: Date | null;

  @Prop({ default: () => new Date() })
  createdAt!: Date;
}

export type ParentStudentLinkDocumentType =
  HydratedDocument<ParentStudentLinkDocument>;

export const ParentStudentLinkSchema = SchemaFactory.createForClass(
  ParentStudentLinkDocument,
);
