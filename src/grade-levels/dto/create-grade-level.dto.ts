import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { BaseCreateDto } from '../../core/dto';

/**
 * DTO for creating a new grade level
 * Only ADMIN can create grade levels
 */
export class CreateGradeLevelDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Grade level display name (e.g., "Grade 10", "Khối 10")',
    example: 'Grade 10',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Grade level name must be a string' })
  @IsNotEmpty({ message: 'Grade level name is required' })
  @MinLength(2, {
    message: 'Grade level name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Grade level name must not exceed 100 characters',
  })
  name!: string;

  @ApiProperty({
    description:
      'Numeric value representing the grade level (0-12 for Vietnamese system)',
    example: 10,
    minimum: 0,
    maximum: 12,
  })
  @IsInt({ message: 'Grade level value must be an integer' })
  @Min(0, { message: 'Grade level value must be at least 0' })
  @Max(12, { message: 'Grade level value must not exceed 12' })
  @IsNotEmpty({ message: 'Grade level value is required' })
  value!: number;
}
