import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseUpdateDto } from '../../core/dto';
import { MaterialType } from './create-material.dto';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for updating an existing material
 * All fields are optional - only provided fields will be updated
 * Only TEACHER and ADMIN can update materials
 */
export class UpdateMaterialDto extends BaseUpdateDto {
  @ApiPropertyOptional({
    description: 'Material title',
    example: 'Updated Course Notes',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'File upload information (URL and optional file size)',
    type: UploadUrlDto,
  })
  @ValidateNested()
  @Type(() => UploadUrlDto)
  @IsOptional()
  file?: UploadUrlDto;

  @ApiPropertyOptional({
    description: 'Type of material file',
    enum: MaterialType,
    example: MaterialType.PDF,
  })
  @IsEnum(MaterialType, { message: 'Type must be a valid material type' })
  @IsOptional()
  type?: MaterialType;

  @ApiPropertyOptional({
    description: 'Description of the material',
    example: 'Updated comprehensive notes',
    minLength: 0,
    maxLength: 500,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  @IsOptional()
  description?: string;
}
