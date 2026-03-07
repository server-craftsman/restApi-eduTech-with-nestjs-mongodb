import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AiTrainingStatus } from '../../../../../enums';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.AiTrainingData })
export class AiTrainingDataDocument extends BaseSchemaFields {
  @Prop({ required: true })
  question!: string;

  @Prop({ required: true })
  answer!: string;

  @Prop({ type: String, default: null })
  subject?: string | null;

  @Prop({ type: String, default: null })
  gradeLevel?: string | null;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({
    required: true,
    enum: AiTrainingStatus,
    default: AiTrainingStatus.Pending,
  })
  status!: AiTrainingStatus;

  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', default: null })
  reviewedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({ type: String, default: null })
  reviewNote?: string | null;
}

export type AiTrainingDataDocumentType =
  HydratedDocument<AiTrainingDataDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const AiTrainingDataSchema = SchemaFactory.createForClass(
  AiTrainingDataDocument,
);

// Index for filtering by status and subject
AiTrainingDataSchema.index({ status: 1, isDeleted: 1, subject: 1 });
