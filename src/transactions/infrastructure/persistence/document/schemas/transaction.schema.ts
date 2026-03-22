import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';
import {
  PaymentProvider,
  TransactionStatus,
  SubscriptionPeriod,
} from '../../../../../enums';

@Schema({ timestamps: true, collection: CollectionName.Transactions })
export class TransactionDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  /** Gói đăng ký liên quan */
  @Prop({ required: true, type: Types.ObjectId, ref: 'subscription_plans' })
  planId!: Types.ObjectId;

  /** Chu kỳ thanh toán */
  @Prop({
    required: true,
    enum: Object.values(SubscriptionPeriod),
    default: SubscriptionPeriod.Monthly,
  })
  subscriptionPeriod!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ default: 'VND' })
  currency!: string;

  @Prop({ required: true, enum: Object.values(PaymentProvider) })
  provider!: string;

  @Prop({ required: true, unique: true })
  providerRefId!: string;

  @Prop({
    required: true,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.Pending,
  })
  status!: string;

  /** Nội dung chuyển khoản */
  @Prop({ type: String, default: null })
  description?: string | null;

  /** Thời điểm thanh toán thành công */
  @Prop({ type: Date, default: null })
  paidAt?: Date | null;
}

export type TransactionDocumentType = HydratedDocument<TransactionDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const TransactionSchema =
  SchemaFactory.createForClass(TransactionDocument);

// ── Indexes ────────────────────────────────────────────────────────────────
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ status: 1 });
