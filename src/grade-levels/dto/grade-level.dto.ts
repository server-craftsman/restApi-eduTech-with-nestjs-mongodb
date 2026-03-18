import { ApiProperty } from '@nestjs/swagger';
import { BaseTimestampsDto } from '../../core/dto';

/**
 * Response DTO for grade level
 * Returned from all GET endpoints and after POST/PUT operations
 */
export class GradeLevelDto extends BaseTimestampsDto {
  @ApiProperty({
    description: 'Unique identifier for the grade level',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Grade level display name (e.g., "Grade 10", "Khối 10")',
    example: 'Grade 10',
  })
  name!: string;

  @ApiProperty({
    description:
      'Numeric value representing the grade level (0-12 for Vietnamese system)',
    example: 10,
  })
  value!: number;
}
