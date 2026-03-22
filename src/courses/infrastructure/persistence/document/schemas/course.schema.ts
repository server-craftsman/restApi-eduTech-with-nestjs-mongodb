import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CourseStatus, CourseType } from '../../../../../enums';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Courses })
export class CourseDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'subjects' })
  subjectId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'grade_levels' })
  gradeLevelId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({
    required: true,
    type: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
    },
  })
  thumbnailUrl!: {
    publicId: string;
    url: string;
  };

  @Prop({ enum: CourseStatus, default: CourseStatus.Draft })
  status!: CourseStatus;

  @Prop({ enum: CourseType, default: CourseType.Free })
  type!: CourseType;

  @Prop({ default: false })
  isPro!: boolean;

  @Prop({ type: String, default: null })
  approvalNote?: string | null;
}

export type CourseDocumentType = HydratedDocument<CourseDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const CourseSchema = SchemaFactory.createForClass(CourseDocument);

// ── Performance indexes for listing/filtering/sorting ─────────────────────
CourseSchema.index({
  isDeleted: 1,
  status: 1,
  gradeLevelId: 1,
  subjectId: 1,
  createdAt: -1,
});
CourseSchema.index({ isDeleted: 1, authorId: 1, createdAt: -1 });
CourseSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });
