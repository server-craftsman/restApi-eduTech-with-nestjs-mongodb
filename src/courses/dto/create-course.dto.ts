import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourseType } from '../../enums';
import { BaseCreateDto } from '../../core/dto';
import { CloudinaryAssetDto } from '../../core/dto/cloudinary-asset.dto';

/**
 * DTO for creating a new course
 * Only TEACHER and ADMIN can create courses
 * Course author is automatically set from JWT token (currentUser)
 */
export class CreateCourseDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Subject ID this course belongs to (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Subject ID must be a valid string' })
  @IsNotEmpty({ message: 'Subject ID is required' })
  subjectId!: string;

  @ApiProperty({
    description:
      'Grade level ID this course belongs to (MongoDB ObjectId) - reference to GradeLevel document',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString({ message: 'Grade level ID must be a valid string' })
  @IsNotEmpty({ message: 'Grade level ID is required' })
  gradeLevelId!: string;

  @ApiProperty({
    description: 'Course title - descriptive name of the course',
    example: 'Introduction to Mathematics',
    minLength: 5,
    maxLength: 255,
  })
  @IsString({ message: 'Course title must be a string' })
  @IsNotEmpty({ message: 'Course title is required' })
  @MinLength(5, { message: 'Course title must be at least 5 characters long' })
  @MaxLength(255, { message: 'Course title must not exceed 255 characters' })
  title!: string;

  @ApiProperty({
    description: 'Detailed course description for learners',
    example:
      'Learn the fundamentals of mathematics from basics to advanced concepts',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString({ message: 'Course description must be a string' })
  @IsNotEmpty({ message: 'Course description is required' })
  @MinLength(10, {
    message: 'Course description must be at least 10 characters long',
  })
  @MaxLength(2000, {
    message: 'Course description must not exceed 2000 characters',
  })
  description!: string;

  @ApiProperty({
    description:
      'Course thumbnail image - Cloudinary asset with publicId and URL',
    type: CloudinaryAssetDto,
    example: {
      publicId: 'courses/math-101/thumbnail',
      url: 'https://res.cloudinary.com/your-account/image/upload/v1234567890/courses/math-101/thumbnail.jpg',
    },
  })
  @ValidateNested()
  @Type(() => CloudinaryAssetDto)
  @IsNotEmpty({ message: 'Thumbnail is required' })
  thumbnailUrl!: CloudinaryAssetDto;

  @ApiProperty({
    description: 'Course type - determines if course is free or premium',
    enum: CourseType,
    example: CourseType.Free,
  })
  @IsEnum(CourseType, { message: 'Course type must be a valid enum value' })
  @IsNotEmpty({ message: 'Course type is required' })
  type!: CourseType;

  @ApiProperty({
    description:
      'Legacy field - use type instead. Indicates if course requires pro subscription',
    example: false,
    required: false,
    deprecated: true,
  })
  @IsBoolean({ message: 'isPro must be a boolean' })
  @IsOptional()
  isPro?: boolean;
}
