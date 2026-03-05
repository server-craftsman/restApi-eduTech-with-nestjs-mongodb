import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

/**
 * DTO for handling file/URL uploads with metadata
 * Consolidates URL and file size information for lessons and materials
 */
export class UploadUrlDto {
  @ApiProperty({
    description: 'File URL (from CDN or cloud storage)',
    example:
      'https://res.cloudinary.com/your-account/video/upload/v1234567890/lessons/intro.mp4',
  })
  @IsString({ message: 'URL must be a string' })
  @IsNotEmpty({ message: 'URL is required' })
  @IsUrl({}, { message: 'Must be a valid URL' })
  url!: string;

  @ApiPropertyOptional({
    description: 'File size in bytes (optional, can be retrieved from URL)',
    example: 2097152,
    minimum: 1,
  })
  @IsInt({ message: 'File size must be an integer' })
  @Min(1, { message: 'File size must be at least 1 byte' })
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Public ID from cloud storage (e.g., Cloudinary publicId)',
    example: 'lessons/intro_video_abc123',
  })
  @IsString({ message: 'Public ID must be a string' })
  @IsOptional()
  publicId?: string;
}
