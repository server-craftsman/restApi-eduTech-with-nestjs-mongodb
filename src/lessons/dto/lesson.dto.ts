import { ApiProperty } from '@nestjs/swagger';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for lesson response - represents the complete lesson data structure
 */
export class LessonDto {
  @ApiProperty({
    description: 'Unique identifier (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Chapter ID this lesson belongs to',
    example: '507f1f77bcf86cd799439012',
  })
  chapterId!: string;

  @ApiProperty({
    description: 'Lesson title',
    example: 'Variables and Data Types',
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed description',
    example: 'Learn about variables and basic data types',
  })
  description!: string;

  @ApiProperty({
    description: 'Display order within chapter',
    example: 0,
  })
  orderIndex!: number;

  @ApiProperty({
    description: 'Duration in seconds',
    example: 600,
  })
  durationSeconds!: number;

  @ApiProperty({
    description: 'Video upload information (URL and file size)',
    type: UploadUrlDto,
  })
  video!: UploadUrlDto;

  @ApiProperty({
    description: 'Markdown content',
    example: '# Introduction to Variables\n\n...',
  })
  contentMd!: string;

  @ApiProperty({
    description: 'Whether this is a free preview lesson',
    example: false,
  })
  isPreview!: boolean;

  @ApiProperty({
    description: 'Associated quiz ID (if any)',
    example: '507f1f77bcf86cd799439022',
    nullable: true,
  })
  quizId?: string | null;

  @ApiProperty({
    description: 'Soft-delete flag',
    example: false,
  })
  isDeleted!: boolean;

  @ApiProperty({
    description: 'Soft-delete timestamp',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-03-05T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-03-05T11:00:00Z',
  })
  updatedAt!: Date;
}
