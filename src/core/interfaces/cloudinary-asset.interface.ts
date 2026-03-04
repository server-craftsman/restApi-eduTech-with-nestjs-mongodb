/**
 * Cloudinary file reference — obtained from POST /uploads
 * Shared across subjects, users, profiles, etc.
 */
export interface CloudinaryAsset {
  /** Cloudinary public_id */
  publicId: string;
  /** Secure HTTPS URL */
  url: string;
}
