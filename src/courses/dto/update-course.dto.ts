import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CloudinaryAssetDto } from '../../core/dto/cloudinary-asset.dto';

/**
 * DTO for updating a course
 * Only the course author (TEACHER) or ADMIN can update courses
 * Partial update - all fields are optional
 */
export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: 'Course title update',
    example: 'Advanced Mathematics - 2026 Edition',
    minLength: 5,
    maxLength: 255,
  })
  @IsString({ message: 'Course title must be a string' })
  @IsOptional()
  @MinLength(5, { message: 'Course title must be at least 5 characters long' })
  @MaxLength(255, { message: 'Course title must not exceed 255 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Course description update',
    example: 'Dive deeper into advanced mathematics topics',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString({ message: 'Course description must be a string' })
  @IsOptional()
  @MinLength(10, {
    message: 'Course description must be at least 10 characters long',
  })
  @MaxLength(2000, {
    message: 'Course description must not exceed 2000 characters',
  })
  description?: string;

  @ApiPropertyOptional({
    description:
      'Course thumbnail image update - Cloudinary asset with publicId and URL',
    type: CloudinaryAssetDto,
    example: {
      publicId: 'courses/math-101/thumbnail-v2',
      url: 'https://res.cloudinary.com/your-account/image/upload/v1234567890/courses/math-101/thumbnail-v2.jpg',
    },
  })
  @ValidateNested()
  @Type(() => CloudinaryAssetDto)
  @IsOptional()
  thumbnailUrl?: CloudinaryAssetDto;

  @ApiPropertyOptional({
    description: 'Legacy field - whether the course is published',
    example: true,
    deprecated: true,
  })
  @IsBoolean({ message: 'isPublished must be a boolean' })
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description:
      'Legacy field - whether the course requires a pro subscription',
    example: false,
    deprecated: true,
  })
  @IsBoolean({ message: 'isPro must be a boolean' })
  @IsOptional()
  isPro?: boolean;
}
