/**
 * Cloudinary file reference — obtained from POST /uploads
 */
export interface SubjectIcon {
  /** Cloudinary public_id */
  publicId: string;
  /** Secure HTTPS URL */
  url: string;
}

export interface Subject {
  id: string;
  name: string;
  /** URL-friendly unique identifier — auto-generated from name */
  slug: string;
  /** Cloudinary icon reference — contains publicId and secure url */
  iconUrl: SubjectIcon;
  /** Soft-delete flag */
  isDeleted: boolean;
  /** Soft-delete timestamp — set when softDelete() is called */
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
