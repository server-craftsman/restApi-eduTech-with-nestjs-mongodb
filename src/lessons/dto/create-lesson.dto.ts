import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseCreateDto } from '../../core/dto';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for creating a new lesson
 * Only TEACHER and ADMIN can create lessons
 */
export class CreateLessonDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Chapter ID this lesson belongs to (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Chapter ID must be a valid string' })
  @IsNotEmpty({ message: 'Chapter ID is required' })
  chapterId!: string;

  @ApiProperty({
    description: 'Lesson title - descriptive name',
    example: 'Variables and Data Types',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Lesson title must be a string' })
  @IsNotEmpty({ message: 'Lesson title is required' })
  @MinLength(3, { message: 'Lesson title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Lesson title must not exceed 200 characters' })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of lesson content',
    example: 'Learn about variables and basic data types in programming',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description!: string;

  @ApiProperty({
    description: 'Display order of the lesson within chapter (0-based index)',
    example: 0,
    minimum: 0,
  })
  @IsInt({ message: 'Order index must be an integer' })
  @Min(0, { message: 'Order index must be at least 0' })
  orderIndex!: number;

  @ApiProperty({
    description:
      'Video upload information. Copy the full object returned by POST /uploads — it already includes durationSeconds for video files.',
    type: UploadUrlDto,
  })
  @ValidateNested()
  @Type(() => UploadUrlDto)
  video!: UploadUrlDto;

  @ApiProperty({
    description: 'Markdown content for the lesson',
    example:
      '# Introduction to Variables\n\nVariables are used to store data...',
    minLength: 1,
    maxLength: 10000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(10000, { message: 'Content must not exceed 10000 characters' })
  contentMd!: string;

  @ApiProperty({
    description: 'Whether this lesson is a free preview',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'isPreview must be a boolean' })
  @IsOptional()
  isPreview?: boolean;
}
