import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.QuizAttempts })
export class QuizAttemptDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'lessons' })
  lessonId!: Types.ObjectId;

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

  @Prop({ enum: ['submitted', 'graded', 'in-progress'], default: 'submitted' })
  status!: string;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Date })
  gradedAt?: Date;
}

export type QuizAttemptDocumentType = HydratedDocument<QuizAttemptDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const QuizAttemptSchema =
  SchemaFactory.createForClass(QuizAttemptDocument);
