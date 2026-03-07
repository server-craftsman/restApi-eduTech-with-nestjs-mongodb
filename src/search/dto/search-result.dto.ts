import { ApiProperty } from '@nestjs/swagger';
import { UploadUrlDto } from '../../uploads/dto';

export class LessonSearchResultDto {
  @ApiProperty({
    description: 'Lesson ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  id!: string;

  @ApiProperty({
    description: 'Chapter ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  chapterId!: string;

  @ApiProperty({
    description: 'Lesson title',
    example: 'Quadratic Functions and Graphs',
  })
  title!: string;

  @ApiProperty({
    description: 'Lesson description',
    example: 'Learn about quadratic functions, vertex, axis of symmetry...',
  })
  description!: string;

  @ApiProperty({
    description:
      'Video upload information — includes durationSeconds for video lessons',
    type: UploadUrlDto,
  })
  video!: UploadUrlDto;

  @ApiProperty({
    description: 'Theory content (Markdown)',
    example: '## Quadratic Functions\n...',
  })
  contentMd!: string;

  @ApiProperty({ description: 'Free preview lesson', example: false })
  isPreview!: boolean;

  @ApiProperty({ description: 'Order index within the chapter', example: 3 })
  orderIndex!: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}

export class MaterialSearchResultDto {
  @ApiProperty({
    description: 'Material ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d3',
  })
  id!: string;

  @ApiProperty({
    description: 'Associated lesson ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  lessonId!: string;

  @ApiProperty({
    description: 'Material title',
    example: 'Quadratic Functions — Summary Sheet',
  })
  title!: string;

  @ApiProperty({
    description: 'File upload information (URL and file size)',
    type: UploadUrlDto,
  })
  file!: UploadUrlDto;

  @ApiProperty({
    description: 'File type (pdf, docx, pptx...)',
    example: 'pdf',
  })
  type!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Search keyword used', example: 'quadratic' })
  keyword!: string;

  @ApiProperty({
    type: [LessonSearchResultDto],
    description: 'Matching lessons',
  })
  lessons!: LessonSearchResultDto[];

  @ApiProperty({
    type: [MaterialSearchResultDto],
    description: 'Matching materials',
  })
  materials!: MaterialSearchResultDto[];

  @ApiProperty({ description: 'Total number of matching lessons', example: 5 })
  totalLessons!: number;

  @ApiProperty({
    description: 'Total number of matching materials',
    example: 3,
  })
  totalMaterials!: number;

  @ApiProperty({
    description: 'Total results (lessons + materials)',
    example: 8,
  })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Results per page', example: 10 })
  limit!: number;
}
