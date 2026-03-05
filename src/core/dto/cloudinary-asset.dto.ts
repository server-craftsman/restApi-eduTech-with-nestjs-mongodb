import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Cloudinary asset reference DTO
 * Used for file uploads (images, videos, etc.)
 */
export class CloudinaryAssetDto {
  @ApiProperty({
    description: 'Cloudinary public_id — unique identifier for the asset',
    example: 'courses/math-101/thumbnail',
  })
  @IsString({ message: 'Public ID must be a valid string' })
  @IsNotEmpty({ message: 'Public ID is required' })
  publicId!: string;

  @ApiProperty({
    description: 'Secure HTTPS URL to access the uploaded file',
    example:
      'https://res.cloudinary.com/your-account/image/upload/v1234567890/courses/math-101/thumbnail.jpg',
  })
  @IsString({ message: 'URL must be a valid string' })
  @IsNotEmpty({ message: 'URL is required' })
  url!: string;
}
