import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'materials' })
export class MaterialDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'lessons' })
  lessonId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({
    required: true,
    type: {
      url: { type: String, required: true },
      fileSize: { type: Number, default: null },
      publicId: { type: String, default: null },
    },
  })
  file!: {
    url: string;
    fileSize?: number | null;
    publicId?: string | null;
  };

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true, default: '' })
  description!: string;

  @Prop({ default: 0 })
  downloadCount!: number;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type MaterialDocumentType = HydratedDocument<MaterialDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const MaterialSchema = SchemaFactory.createForClass(MaterialDocument);
