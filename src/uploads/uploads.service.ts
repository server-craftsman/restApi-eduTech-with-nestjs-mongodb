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
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            folder: String(result['folder'] ?? folder),
            width: result.width,
            height: result.height,
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
}
