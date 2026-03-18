import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';

/**
 * Chapter response DTO — mirrors domain interface
 */
export class ChapterDto extends BaseAuditDto {
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
}
