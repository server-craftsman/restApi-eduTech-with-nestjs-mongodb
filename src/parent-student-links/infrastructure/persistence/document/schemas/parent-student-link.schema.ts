import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: false, collection: 'parent_student_links' })
export class ParentStudentLinkDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'parent_profiles' })
  parentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'student_profiles' })
  studentId!: Types.ObjectId;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ type: String, default: null })
  linkCode?: string | null;

  @Prop({ type: Date, default: null })
  linkCodeExpires?: Date | null;

  @Prop({ default: () => new Date() })
  createdAt!: Date;
}

export type ParentStudentLinkDocumentType =
  HydratedDocument<ParentStudentLinkDocument>;

export const ParentStudentLinkSchema = SchemaFactory.createForClass(
  ParentStudentLinkDocument,
);
