import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'questions' })
export class QuestionDocument {
  @Prop({ type: Types.ObjectId, ref: 'quizzes' })
  quizId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'lessons' })
  lessonId?: Types.ObjectId;

  @Prop({ required: true })
  contentHtml!: string;

  @Prop({
    required: true,
    enum: ['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'TRUE_FALSE'],
  })
  type!: string;

  @Prop({ required: true, enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: string;

  @Prop({ required: true, type: [String] })
  options!: string[];

  @Prop({ required: true })
  correctAnswer!: string;

  @Prop({ required: true })
  explanation!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 10 })
  points!: number;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type QuestionDocumentType = HydratedDocument<QuestionDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const QuestionSchema = SchemaFactory.createForClass(QuestionDocument);
