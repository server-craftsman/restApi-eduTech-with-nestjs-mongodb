import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Questions })
export class QuestionDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'lessons' })
  lessonId!: Types.ObjectId;

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
}

export type QuestionDocumentType = HydratedDocument<QuestionDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const QuestionSchema = SchemaFactory.createForClass(QuestionDocument);
