import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';
import { ExamScope } from '../../../../../enums';

@Schema({ timestamps: true, collection: CollectionName.Exams })
export class ExamDocument extends BaseSchemaFields {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  // ── Ownership / Context ────────────────────────────────────────────────

  /** Phạm vi đề thi: 'course' (cuối khoá) | 'chapter' (cuối chương) */
  @Prop({ required: true, enum: Object.values(ExamScope) })
  scope!: ExamScope;

  /** Khoá học mà đề thi thuộc về */
  @Prop({ required: true, type: Types.ObjectId, ref: 'courses' })
  courseId!: Types.ObjectId;

  /** Chương cụ thể (chỉ có khi scope = 'chapter') */
  @Prop({ type: Types.ObjectId, ref: 'chapters', default: null })
  chapterId?: Types.ObjectId | null;

  /** Giáo viên / Admin tạo đề thi */
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  createdBy!: Types.ObjectId;

  // ── Content ────────────────────────────────────────────────────────────

  /** Ordered array of question ObjectIds */
  @Prop({ type: [Types.ObjectId], default: [] })
  questionIds!: Types.ObjectId[];

  @Prop({ required: true, default: 0 })
  totalQuestions!: number;

  @Prop({ required: true, default: 1800 })
  timeLimitSeconds!: number;

  @Prop({ required: true, default: 50 })
  passingScore!: number;

  @Prop({ default: false })
  isPublished!: boolean;
}

export type ExamDocumentType = HydratedDocument<ExamDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const ExamSchema = SchemaFactory.createForClass(ExamDocument);

// ── Indexes ────────────────────────────────────────────────────────────────
ExamSchema.index({ courseId: 1 });
ExamSchema.index({ chapterId: 1 });
ExamSchema.index({ courseId: 1, scope: 1 });
ExamSchema.index({ createdBy: 1 });
