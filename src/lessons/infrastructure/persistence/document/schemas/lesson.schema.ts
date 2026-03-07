import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'lessons' })
export class LessonDocument {
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

  @Prop({ type: Types.ObjectId, ref: 'quizzes', default: null })
  quizId?: Types.ObjectId | null;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type LessonDocumentType = HydratedDocument<LessonDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const LessonSchema = SchemaFactory.createForClass(LessonDocument);
