import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.WrongAnswers })
export class WrongAnswerDocument extends BaseSchemaFields {
  /** The student this record belongs to */
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  /** The question that was answered incorrectly */
  @Prop({ required: true, type: Types.ObjectId, ref: 'questions' })
  questionId!: Types.ObjectId;

  /** Lesson the question belongs to — stored for efficient lesson-level filtering */
  @Prop({ required: true, type: Types.ObjectId, ref: 'lessons' })
  lessonId!: Types.ObjectId;

  /** Incremented each time the student gets this question wrong */
  @Prop({ default: 1 })
  failCount!: number;

  /** Timestamp of the most recent wrong answer */
  @Prop({ type: Date, default: () => new Date() })
  lastFailedAt!: Date;

  /** Set to true once the student answers this question correctly */
  @Prop({ default: false })
  isMastered!: boolean;

  /** Timestamp when isMastered flipped to true */
  @Prop({ type: Date, default: null })
  masteredAt?: Date | null;
}

export type WrongAnswerDocumentType = HydratedDocument<WrongAnswerDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const WrongAnswerSchema =
  SchemaFactory.createForClass(WrongAnswerDocument);

// Compound unique index: one record per (user, question) pair
WrongAnswerSchema.index({ userId: 1, questionId: 1 }, { unique: true });
// Fast look-up by user
WrongAnswerSchema.index({ userId: 1, isMastered: 1 });
// Fast look-up by user + lesson
WrongAnswerSchema.index({ userId: 1, lessonId: 1, isMastered: 1 });
