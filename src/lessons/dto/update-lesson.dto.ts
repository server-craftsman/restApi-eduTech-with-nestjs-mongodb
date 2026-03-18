import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseUpdateDto } from '../../core/dto';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for updating an existing lesson
 * All fields are optional - only provided fields will be updated
 * Only TEACHER and ADMIN can update lessons
 */
export class UpdateLessonDto extends BaseUpdateDto {
  @ApiPropertyOptional({
    description: 'Lesson title',
    example: 'Advanced Variables',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of lesson content',
    example: 'Advanced lessons on variables and scope',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Display order within chapter',
    example: 2,
    minimum: 0,
  })
  @IsInt({ message: 'Order index must be an integer' })
  @Min(0, { message: 'Order index must be at least 0' })
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({
    description:
      'Video upload information. Copy the full object returned by POST /uploads — it already includes durationSeconds for video files.',
    type: UploadUrlDto,
  })
  @ValidateNested()
  @Type(() => UploadUrlDto)
  @IsOptional()
  video?: UploadUrlDto;

  @ApiPropertyOptional({
    description: 'Markdown content for the lesson',
    example: '# Advanced Variables\n\nDetailed content...',
    minLength: 1,
    maxLength: 10000,
  })
  @IsString({ message: 'Content must be a string' })
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(10000, { message: 'Content must not exceed 10000 characters' })
  @IsOptional()
  contentMd?: string;

  @ApiPropertyOptional({
    description: 'Whether this lesson is a free preview',
    example: true,
  })
  @IsBoolean({ message: 'isPreview must be a boolean' })
  @IsOptional()
  isPreview?: boolean;
}
