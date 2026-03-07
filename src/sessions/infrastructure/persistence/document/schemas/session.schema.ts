import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.Sessions })
export class SessionDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  hashedRt!: string;

  @Prop({ required: true })
  deviceInfo!: string;

  @Prop({ required: true })
  ipAddress!: string;

  @Prop({ required: true })
  expiresAt!: Date;
}

export type SessionDocumentType = HydratedDocument<SessionDocument> & {
  createdAt: Date;
};

export const SessionSchema = SchemaFactory.createForClass(SessionDocument);
