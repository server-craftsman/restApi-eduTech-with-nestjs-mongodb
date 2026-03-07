import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AiMessageRole } from '../../../../../enums';
import {
  BaseSchemaFields,
  CollectionName,
} from '../../../../../core/constants';

/** Embedded sub-document representing a single chat message. */
@Schema({ _id: false, timestamps: false })
export class AiMessageSubDoc {
  @Prop({ required: true, enum: AiMessageRole })
  role!: AiMessageRole;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true, default: () => new Date() })
  timestamp!: Date;
}

@Schema({ timestamps: true, collection: CollectionName.AiConversations })
export class AiConversationDocument extends BaseSchemaFields {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true, default: 'New Conversation' })
  title!: string;

  @Prop({ type: String, default: null })
  subject?: string | null;

  @Prop({ type: [AiMessageSubDoc], default: [] })
  messages!: AiMessageSubDoc[];

  @Prop({ default: 0 })
  totalTokensUsed!: number;

  @Prop({ type: String, default: null })
  lastModel?: string | null;
}

export type AiConversationDocumentType =
  HydratedDocument<AiConversationDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const AiConversationSchema = SchemaFactory.createForClass(
  AiConversationDocument,
);

// Index for listing user conversations efficiently
AiConversationSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
