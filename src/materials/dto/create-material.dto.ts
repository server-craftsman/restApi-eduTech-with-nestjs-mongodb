import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseCreateDto } from '../../core/dto';
import { UploadUrlDto } from '../../uploads/dto';

export enum MaterialType {
  PDF = 'PDF',
  DOC = 'DOC',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  PRESENTATION = 'PRESENTATION',
  SPREADSHEET = 'SPREADSHEET',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER',
}

/**
 * DTO for creating a new material
 * Only TEACHER and ADMIN can create materials
 */
export class CreateMaterialDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Lesson ID this material belongs to (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Lesson ID must be a valid string' })
  @IsNotEmpty({ message: 'Lesson ID is required' })
  lessonId!: string;

  @ApiProperty({
    description: 'Material title/name',
    example: 'Course Notes PDF',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title!: string;

  @ApiProperty({
    description: 'File upload information (URL and optional file size)',
    type: UploadUrlDto,
  })
  @ValidateNested()
  @Type(() => UploadUrlDto)
  file!: UploadUrlDto;

  @ApiProperty({
    description: 'Type of material file',
    enum: MaterialType,
    example: MaterialType.PDF,
  })
  @IsEnum(MaterialType, { message: 'Type must be a valid material type' })
  type!: MaterialType;

  @ApiPropertyOptional({
    description: 'Description of the material',
    example: 'Comprehensive notes covering chapters 1-3',
    minLength: 0,
    maxLength: 500,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  @IsOptional()
  description?: string;
}
