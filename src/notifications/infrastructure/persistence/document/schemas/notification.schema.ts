import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';
import { NotificationType } from '../../../../../enums';

@Schema({ timestamps: true, collection: CollectionName.Notifications })
export class NotificationDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ required: true, enum: NotificationType })
  type!: NotificationType;

  @Prop({ type: String, default: null })
  actionUrl?: string | null;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, unknown> | null;

  @Prop({ default: false })
  emailSent!: boolean;

  @Prop({ type: String, default: null })
  novuMessageId?: string | null;
}

export type NotificationDocumentType =
  HydratedDocument<NotificationDocument> & {
    createdAt: Date;
  };

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationDocument);
