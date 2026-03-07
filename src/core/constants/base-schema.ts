import { Prop } from '@nestjs/mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// BASE_MODEL_FIELDS — Standard field names shared by every document schema.
// Import BaseFieldName to type-check sort keys, query projections, etc.
// ─────────────────────────────────────────────────────────────────────────────

/** Field name union covering the audit / lifecycle columns present on every document. */
export type BaseFieldName =
  | 'isDeleted'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt';

/**
 * Convenience array of the base field names — useful for generic utilities
 * that strip/include them (e.g., mapper helpers, projection builders).
 */
export const BASE_FIELD_NAMES: readonly BaseFieldName[] = [
  'isDeleted',
  'deletedAt',
  'createdAt',
  'updatedAt',
] as const;

/**
 * Mixin class that adds standard soft-delete fields to any Mongoose schema.
 *
 * Usage — extend your document class:
 * ```ts
 * @Schema({ timestamps: true, collection: CollectionName.Users })
 * export class UserDocument extends BaseSchemaFields {
 *   @Prop({ required: true }) email!: string;
 * }
 * ```
 *
 * The `timestamps: true` option on @Schema will auto-create `createdAt` and
 * `updatedAt`.  This mixin only declares the *soft-delete* props so they
 * are always present with consistent defaults.
 */
export abstract class BaseSchemaFields {
  /** Soft-delete flag — set to `true` by `softDelete()`. Default `false`. */
  @Prop({ default: false })
  isDeleted!: boolean;

  /** Timestamp of soft deletion. `null` when the document is active. */
  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

/**
 * Mongoose query filter that excludes soft-deleted documents.
 *
 * Spread into any `.find()` / `.findOne()` / `.countDocuments()` query:
 * ```ts
 * this.model.find({ ...NOT_DELETED, role: 'STUDENT' });
 * ```
 */
export const NOT_DELETED = { isDeleted: { $ne: true } } as const;
