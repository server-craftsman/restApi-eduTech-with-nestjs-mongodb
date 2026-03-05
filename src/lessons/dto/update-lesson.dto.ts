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
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for updating an existing lesson
 * All fields are optional - only provided fields will be updated
 * Only TEACHER and ADMIN can update lessons
 */
export class UpdateLessonDto {
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
    description: 'Duration in seconds',
    example: 800,
    minimum: 1,
  })
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 second' })
  @IsOptional()
  durationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Video upload information (URL and optional file size)',
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

  @ApiPropertyOptional({
    description: 'Associated quiz ID',
    example: '507f1f77bcf86cd799439022',
  })
  @IsString({ message: 'Quiz ID must be a string' })
  @IsOptional()
  quizId?: string;
}
