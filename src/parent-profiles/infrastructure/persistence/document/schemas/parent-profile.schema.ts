import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ParentRelationship } from '../../../../../enums';
import { CollectionName } from '../../../../../core/constants';

@Schema({ timestamps: true, collection: CollectionName.ParentProfiles })
export class ParentProfileDocument {
  @Prop({ required: true, type: Types.ObjectId, ref: 'users', unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true })
  phoneNumber!: string;

  // ── Approval-review fields ─────────────────────────────────────────────────
  @Prop({ type: String, enum: ParentRelationship, default: null })
  relationship?: ParentRelationship | null;

  @Prop({ type: String, default: null })
  nationalIdNumber?: string | null;

  @Prop({ type: String, default: null })
  nationalIdImageUrl?: string | null;
}

export type ParentProfileDocumentType =
  HydratedDocument<ParentProfileDocument> & {
    createdAt: Date;
    updatedAt: Date;
  };

export const ParentProfileSchema = SchemaFactory.createForClass(
  ParentProfileDocument,
);
