import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';
import { SubscriptionStatus } from '../../../../../enums';

@Schema({ timestamps: true, collection: CollectionName.UserSubscriptions })
export class UserSubscriptionDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'subscription_plans' })
  planId!: Types.ObjectId;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({
    required: true,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.Active,
  })
  status!: SubscriptionStatus;
}

export type UserSubscriptionDocumentType =
  HydratedDocument<UserSubscriptionDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const UserSubscriptionSchema = SchemaFactory.createForClass(
  UserSubscriptionDocument,
);
