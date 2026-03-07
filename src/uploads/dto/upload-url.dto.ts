import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsInt,
  Min,
  IsOptional,
  IsPositive,
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
    description: 'Cloud storage public ID for asset management',
    example: 'lessons/intro_abc123',
  })
  @IsString({ message: 'Public ID must be a string' })
  @IsOptional()
  publicId?: string;

  @ApiPropertyOptional({
    description:
      'Video duration in seconds — returned by POST /uploads for video files. ' +
      'Copy this from the upload response; CreateLessonDto will auto-use it ' +
      'when top-level durationSeconds is omitted.',
    example: 382,
    minimum: 1,
  })
  @IsInt({ message: 'Duration must be an integer number of seconds' })
  @IsPositive({ message: 'Duration must be greater than 0' })
  @IsOptional()
  durationSeconds?: number;
}
