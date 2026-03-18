import { ApiProperty } from '@nestjs/swagger';

/**
 * Base DTO for timestamp fields only (createdAt, updatedAt)
 * Use this when you need timestamps but not soft-delete fields
 */
export class BaseTimestampsDto {
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

/**
 * Base DTO for identification only (id field)
 * Use when building mini DTOs that only expose ID
 */
export class BaseIdDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;
}
