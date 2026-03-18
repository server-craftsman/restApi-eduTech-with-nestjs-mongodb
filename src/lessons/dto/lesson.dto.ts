import { ApiProperty } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for lesson response - represents the complete lesson data structure
 */
export class LessonDto extends BaseAuditDto {
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
    description:
      'Video upload information — includes durationSeconds for video files',
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
}
