import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Chapter response DTO — mirrors domain interface
 */
export class ChapterDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  courseId!: string;

  @ApiProperty({ example: 'Introduction to TypeScript' })
  title!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Learn the basics of TypeScript',
  })
  description?: string | null;

  @ApiProperty({ example: 1 })
  orderIndex!: number;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: false })
  isDeleted!: boolean;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    example: '2026-03-05T10:30:00Z',
  })
  deletedAt?: Date | null;

  @ApiProperty({ example: '2026-03-01T10:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-03-05T10:30:00Z' })
  updatedAt!: Date;
}
