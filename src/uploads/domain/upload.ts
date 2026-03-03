/**
 * Represents the result of a successful file upload to Cloudinary
 */
export interface UploadResult {
  /** Cloudinary public_id — use this to reference or delete the file */
  publicId: string;
  /** Secure HTTPS URL to access the uploaded file */
  url: string;
  /** Cloudinary resource type: 'image' | 'video' | 'raw' */
  resourceType: string;
  /** File format/extension (e.g. 'jpg', 'svg', 'mp4', 'pdf') */
  format: string;
  /** File size in bytes */
  bytes: number;
  /** Cloudinary folder path */
  folder: string;
  /** Image width in pixels (images only) */
  width?: number;
  /** Image height in pixels (images only) */
  height?: number;
}
