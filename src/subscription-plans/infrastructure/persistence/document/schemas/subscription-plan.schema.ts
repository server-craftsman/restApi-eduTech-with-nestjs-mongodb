import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.SubscriptionPlans })
export class SubscriptionPlanDocument {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  durationDays!: number;

  @Prop({ required: true, type: [String] })
  features!: string[];
}

export type SubscriptionPlanDocumentType =
  HydratedDocument<SubscriptionPlanDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const SubscriptionPlanSchema = SchemaFactory.createForClass(
  SubscriptionPlanDocument,
);
