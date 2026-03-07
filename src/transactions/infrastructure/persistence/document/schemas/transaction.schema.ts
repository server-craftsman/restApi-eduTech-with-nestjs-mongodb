import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Transactions })
export class TransactionDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ default: 'VND' })
  currency!: string;

  @Prop({ required: true, enum: ['MOMO', 'VNPAY'] })
  provider!: string;

  @Prop({ required: true, unique: true })
  providerRefId!: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING',
  })
  status!: string;
}

export type TransactionDocumentType = HydratedDocument<TransactionDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const TransactionSchema =
  SchemaFactory.createForClass(TransactionDocument);
