import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for grade level
 * Returned from all GET endpoints and after POST/PUT operations
 */
export class GradeLevelDto {
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

  @ApiProperty({
    description: 'ISO 8601 timestamp when the grade level was created',
    example: '2026-03-05T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the grade level was last updated',
    example: '2026-03-05T10:00:00Z',
  })
  updatedAt!: Date;
}
