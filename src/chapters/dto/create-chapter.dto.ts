import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNotEmpty,
  Min,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({
    description: 'Course ID this chapter belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Course ID must be a valid string' })
  @IsNotEmpty({ message: 'Course ID is required' })
  courseId!: string;

  @ApiProperty({
    description: 'Chapter title',
    example: 'Introduction to TypeScript',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Chapter title must be a string' })
  @IsNotEmpty({ message: 'Chapter title is required' })
  @MinLength(3, { message: 'Chapter title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Chapter title must not exceed 255 characters' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Chapter description',
    example: 'Learn the basics of TypeScript',
    minLength: 5,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Chapter description must be a string' })
  @MinLength(5, {
    message: 'Chapter description must be at least 5 characters long',
  })
  @MaxLength(1000, {
    message: 'Chapter description must not exceed 1000 characters',
  })
  description?: string;

  @ApiProperty({
    description: 'Display order of the chapter within the course',
    example: 1,
    minimum: 0,
  })
  @IsInt({ message: 'Order index must be an integer' })
  @IsNotEmpty({ message: 'Order index is required' })
  @Min(0, { message: 'Order index must be a non-negative number' })
  orderIndex!: number;
}
