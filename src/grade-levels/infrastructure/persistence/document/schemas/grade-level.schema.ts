import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.GradeLevels })
export class GradeLevelDocument {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  value!: number;
}

export type GradeLevelDocumentType = HydratedDocument<GradeLevelDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const GradeLevelSchema =
  SchemaFactory.createForClass(GradeLevelDocument);
