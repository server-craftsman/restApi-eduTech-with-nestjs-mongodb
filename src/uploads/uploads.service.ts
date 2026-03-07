import { Injectable, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import { StorageService } from '../storage/storage.service';
import { UploadResult } from './domain/upload';

@Injectable()
export class UploadsService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload a file buffer to Cloudinary via upload stream.
   * Requires multer memory storage so that file.buffer is populated.
   *
   * @param file - Multer file object from memory storage
   * @param subfolder - Optional subfolder within the base Cloudinary folder
   *                    e.g. 'subjects', 'avatars', 'materials'
   * @returns UploadResult with publicId and secure url
   */
  async uploadFile(
    file: Express.Multer.File,
    subfolder?: string,
  ): Promise<UploadResult> {
    if (!file?.buffer) {
      throw new BadRequestException('No file provided');
    }

    const cloudinary = this.storageService.getClient();
    const baseFolder = this.storageService.getFolder();
    const folder = subfolder ? `${baseFolder}/${subfolder}` : baseFolder;

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(
              new BadRequestException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
            return;
          }
          if (!result) {
            reject(new BadRequestException('Upload returned no result'));
            return;
          }

          const duration =
            typeof result.duration === 'number' ? result.duration : undefined;

          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            folder: String(result['folder'] ?? folder),
            width: result.width,
            height: result.height,
            // duration is a float (e.g. 30.06) — only present for video
            durationSeconds:
              result.resource_type === 'video' && duration !== undefined
                ? Math.round(duration)
                : undefined,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete a file from Cloudinary by public_id.
   *
   * @param publicId - Cloudinary public_id (e.g. 'edutech/subjects/abc123')
   * @param resourceType - Resource type, defaults to 'image'
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<void> {
    const cloudinary = this.storageService.getClient();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  /**
   * Validate if a URL is valid and properly formatted
   * @param url - URL to validate
   * @returns true if URL is valid, false otherwise
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate file size is within acceptable limits
   * @param fileSize - File size in bytes
   * @param maxSize - Maximum allowed size in bytes (default: 500MB for videos, 100MB for documents)
   * @returns true if file size is valid
   */
  isValidFileSize(
    fileSize: number,
    maxSize: number = 500 * 1024 * 1024,
  ): boolean {
    return fileSize > 0 && fileSize <= maxSize;
  }

  /**
   * Format file size for display (e.g., "2.5 MB")
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
