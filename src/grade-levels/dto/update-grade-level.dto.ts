import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { BaseUpdateDto } from '../../core/dto';

/**
 * DTO for updating a grade level
 * Only ADMIN can update grade levels
 */
export class UpdateGradeLevelDto extends BaseUpdateDto {
  @ApiPropertyOptional({
    description:
      'Grade level display name (e.g., "Grade 10", "Khối 10") - optional update',
    example: 'Grade 10 - Advanced',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Grade level name must be a string' })
  @IsOptional()
  @MinLength(2, {
    message: 'Grade level name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Grade level name must not exceed 100 characters',
  })
  name?: string;

  @ApiPropertyOptional({
    description:
      'Numeric value of the grade level (0-12 for Vietnamese system) - optional update',
    example: 11,
    minimum: 0,
    maximum: 12,
  })
  @IsInt({ message: 'Grade level value must be an integer' })
  @IsOptional()
  @Min(0, { message: 'Grade level value must be at least 0' })
  @Max(12, { message: 'Grade level value must not exceed 12' })
  value?: number;
}
