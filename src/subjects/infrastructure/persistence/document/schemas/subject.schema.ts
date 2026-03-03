import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Stored type for the iconUrl nested object */
export interface SubjectIconType {
  publicId: string;
  url: string;
}

@Schema({ timestamps: true, collection: 'subjects' })
export class SubjectDocument {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  // CRITICAL: nested objects MUST use explicit type param to avoid CannotDetermineTypeError
  @Prop({
    type: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
    },
    required: true,
    _id: false,
  })
  iconUrl!: SubjectIconType;

  // ── Soft-delete fields ──────────────────────────────────────────
  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type SubjectDocumentType = HydratedDocument<SubjectDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const SubjectSchema = SchemaFactory.createForClass(SubjectDocument);

// Compound index for faster queries
SubjectSchema.index({ isDeleted: 1, createdAt: -1 });
