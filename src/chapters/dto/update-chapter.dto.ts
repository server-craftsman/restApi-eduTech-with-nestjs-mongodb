import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { BaseUpdateDto } from '../../core/dto';

export class UpdateChapterDto extends BaseUpdateDto {
  @ApiPropertyOptional({
    description: 'Course ID this chapter belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Course ID must be a valid string' })
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Chapter title',
    example: 'Advanced TypeScript',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Chapter title must be a string' })
  @IsOptional()
  @MinLength(3, { message: 'Chapter title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Chapter title must not exceed 255 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Chapter description',
    example: 'Master advanced TypeScript concepts',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString({ message: 'Chapter description must be a string' })
  @IsOptional()
  @MinLength(5, {
    message: 'Chapter description must be at least 5 characters long',
  })
  @MaxLength(1000, {
    message: 'Chapter description must not exceed 1000 characters',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Display order of the chapter within the course',
    example: 2,
    minimum: 0,
  })
  @IsInt({ message: 'Order index must be an integer' })
  @IsOptional()
  @Min(0, { message: 'Order index must be a non-negative number' })
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Whether the chapter is published and visible to students',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
