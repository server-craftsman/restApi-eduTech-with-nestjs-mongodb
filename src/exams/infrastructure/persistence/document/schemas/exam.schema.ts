import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Exams })
export class ExamDocument extends BaseSchemaFields {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: String, default: null })
  description?: string | null;

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

  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  createdBy!: Types.ObjectId;
}

export type ExamDocumentType = HydratedDocument<ExamDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const ExamSchema = SchemaFactory.createForClass(ExamDocument);
