/**
 * Interface for consolidated file/URL metadata
 * Used in domain models for lessons and materials
 */
export interface IUploadFile {
  url: string;
  fileSize?: number;
  publicId?: string; // Cloud storage public ID (e.g., Cloudinary publicId)
}
