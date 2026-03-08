import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.ExamAttempts })
export class ExamAttemptDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'exams' })
  examId!: Types.ObjectId;

  @Prop({ type: Array, default: [] })
  answers!: Array<{
    questionId: string;
    selectedAnswer: string | string[];
    isCorrect: boolean;
    timeSpentMs?: number;
  }>;

  @Prop({ required: true, default: 0 })
  score!: number;

  @Prop({ required: true, default: 0 })
  totalQuestions!: number;

  @Prop({ required: true, default: 0 })
  correctAnswers!: number;

  @Prop({ required: true, default: 0 })
  totalTimeSpentMs!: number;

  @Prop({ required: true, default: false })
  passed!: boolean;

  @Prop({ enum: ['submitted', 'graded'], default: 'graded' })
  status!: string;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({ type: Date, default: null })
  gradedAt?: Date | null;
}

export type ExamAttemptDocumentType = HydratedDocument<ExamAttemptDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const ExamAttemptSchema =
  SchemaFactory.createForClass(ExamAttemptDocument);

// Index: lookup all attempts for a user or for an exam
ExamAttemptSchema.index({ userId: 1 });
ExamAttemptSchema.index({ examId: 1 });
ExamAttemptSchema.index({ userId: 1, examId: 1 });
