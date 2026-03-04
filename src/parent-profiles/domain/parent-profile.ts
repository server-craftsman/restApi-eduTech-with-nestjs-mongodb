import { ParentRelationship } from '../../enums';

export interface ParentProfile {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;

  // ── Approval-review fields ─────────────────────────────────────────────────
  /** Relationship to the student (Father / Mother / Guardian / Other). */
  relationship?: ParentRelationship | null;
  /** National ID card number (CCCD / CMND) for identity verification. */
  nationalIdNumber?: string | null;
  /** URL of the uploaded national ID card image. */
  nationalIdImageUrl?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
