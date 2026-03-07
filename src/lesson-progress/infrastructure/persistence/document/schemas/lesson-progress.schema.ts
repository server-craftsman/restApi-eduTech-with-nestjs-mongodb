import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.LessonProgress })
export class LessonProgressDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'lessons' })
  lessonId!: Types.ObjectId;

  @Prop({ default: false })
  isCompleted!: boolean;

  @Prop({ default: 0 })
  lastWatchedSec!: number;

  @Prop({ default: 0, min: 0, max: 100 })
  progressPercent!: number;

  @Prop({ default: false })
  videoWatched!: boolean;

  @Prop({ default: 0 })
  videoCurrentTime!: number;

  @Prop({ default: 0 })
  videoDuration!: number;

  @Prop({ default: false })
  quizCompleted!: boolean;

  @Prop({ min: 0, max: 100 })
  quizScore?: number;

  @Prop({ type: Date })
  lastWatchedAt?: Date;
}

export type LessonProgressDocumentType =
  HydratedDocument<LessonProgressDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const LessonProgressSchema = SchemaFactory.createForClass(
  LessonProgressDocument,
);
