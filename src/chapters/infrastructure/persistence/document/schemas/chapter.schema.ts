import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Chapters })
export class ChapterDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'courses' })
  courseId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ required: true, default: 0 })
  orderIndex!: number;

  @Prop({ default: false })
  isPublished!: boolean;

}

export type ChapterDocumentType = HydratedDocument<ChapterDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const ChapterSchema = SchemaFactory.createForClass(ChapterDocument);
