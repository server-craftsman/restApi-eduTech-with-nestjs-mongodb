import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Lessons })
export class LessonDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'chapters' })
  chapterId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, default: '' })
  description!: string;

  @Prop({ required: true, default: 0 })
  orderIndex!: number;

  @Prop({
    required: true,
    type: {
      url: { type: String, required: true },
      fileSize: { type: Number, default: null },
      publicId: { type: String, default: null },
      durationSeconds: { type: Number, default: null },
    },
  })
  video!: {
    url: string;
    fileSize?: number | null;
    publicId?: string | null;
    durationSeconds?: number | null;
  };

  @Prop({ required: true, default: '' })
  contentMd!: string;

  @Prop({ default: false })
  isPreview!: boolean;
}

export type LessonDocumentType = HydratedDocument<LessonDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const LessonSchema = SchemaFactory.createForClass(LessonDocument);
