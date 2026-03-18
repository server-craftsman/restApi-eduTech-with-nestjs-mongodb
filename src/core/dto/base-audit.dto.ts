import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base DTO for all entities with audit fields
 * Includes soft-delete support and timestamp tracking
 *
 * All response DTOs that represent complete entities should extend this class
 */
export class BaseAuditDto {
  @ApiProperty({
    description: 'Unique identifier (MongoDB _id converted to string)',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Soft-delete flag; true means the record has been deleted',
    example: false,
  })
  isDeleted!: boolean;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'Timestamp when record was soft-deleted',
    example: null,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'Timestamp when record was created',
    example: '2026-03-18T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when record was last updated',
    example: '2026-03-18T10:30:00.000Z',
  })
  updatedAt!: Date;
}
