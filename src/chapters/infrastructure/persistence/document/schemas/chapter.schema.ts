import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'chapters' })
export class ChapterDocument {
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

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type ChapterDocumentType = HydratedDocument<ChapterDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const ChapterSchema = SchemaFactory.createForClass(ChapterDocument);
