import { ApiProperty } from '@nestjs/swagger';
import { UploadUrlDto } from '../../uploads/dto';
import { SearchType } from './search-query.dto';

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

  @ApiProperty({ description: 'Computed relevance score', example: 92 })
  score!: number;
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

  @ApiProperty({ description: 'Computed relevance score', example: 81 })
  score!: number;
}

export class CourseSearchResultDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439020' })
  id!: string;

  @ApiProperty({ example: 'Algebra Foundation' })
  title!: string;

  @ApiProperty({ example: 'Master linear and quadratic algebra basics' })
  description!: string;

  @ApiProperty({ example: 'Published' })
  status!: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Computed relevance score', example: 89 })
  score!: number;
}

export class ChapterSearchResultDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439021' })
  id!: string;

  @ApiProperty({ example: 'Quadratic Functions' })
  title!: string;

  @ApiProperty({
    example: 'Understand vertex, parabola shape and graph transformations',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({ example: '665f1f77bcf86cd799439020' })
  courseId!: string;

  @ApiProperty({ example: 2 })
  orderIndex!: number;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Computed relevance score', example: 86 })
  score!: number;
}

export class SubjectSearchResultDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439022' })
  id!: string;

  @ApiProperty({ example: 'Toán Học' })
  name!: string;

  @ApiProperty({ example: 'toan-hoc' })
  slug!: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Computed relevance score', example: 95 })
  score!: number;
}

export class ExamSearchResultDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439023' })
  id!: string;

  @ApiProperty({ example: 'Midterm Algebra Exam' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Covers chapters 1-4' })
  description?: string | null;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: 'course' })
  scope!: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Computed relevance score', example: 88 })
  score!: number;
}

export class SearchMixedItemDto {
  @ApiProperty({ enum: SearchType, enumName: 'SearchType', example: 'lessons' })
  type!: SearchType;

  @ApiProperty({ example: '665f1f77bcf86cd799439021' })
  id!: string;

  @ApiProperty({ example: 'Quadratic Functions' })
  title!: string;

  @ApiProperty({ example: 'Match preview text', nullable: true })
  snippet?: string | null;

  @ApiProperty({ example: 90 })
  score!: number;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt!: Date;
}

export class SearchGroupResultDto {
  @ApiProperty({ type: [LessonSearchResultDto] })
  lessons!: LessonSearchResultDto[];

  @ApiProperty({ type: [MaterialSearchResultDto] })
  materials!: MaterialSearchResultDto[];

  @ApiProperty({ type: [CourseSearchResultDto] })
  courses!: CourseSearchResultDto[];

  @ApiProperty({ type: [ChapterSearchResultDto] })
  chapters!: ChapterSearchResultDto[];

  @ApiProperty({ type: [SubjectSearchResultDto] })
  subjects!: SubjectSearchResultDto[];

  @ApiProperty({ type: [ExamSearchResultDto] })
  exams!: ExamSearchResultDto[];
}

export class SearchCountByTypeDto {
  @ApiProperty({ example: 5 })
  lessons!: number;

  @ApiProperty({ example: 3 })
  materials!: number;

  @ApiProperty({ example: 2 })
  courses!: number;

  @ApiProperty({ example: 2 })
  chapters!: number;

  @ApiProperty({ example: 1 })
  subjects!: number;

  @ApiProperty({ example: 1 })
  exams!: number;
}

export class SearchMetaDto {
  @ApiProperty({ example: 'toan hoc' })
  normalizedKeyword!: string;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 14 })
  total!: number;

  @ApiProperty({ type: SearchCountByTypeDto })
  countByType!: SearchCountByTypeDto;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Search keyword used', example: 'quadratic' })
  keyword!: string;

  @ApiProperty({ type: [SearchMixedItemDto] })
  items!: SearchMixedItemDto[];

  @ApiProperty({ type: SearchGroupResultDto })
  grouped!: SearchGroupResultDto;

  @ApiProperty({ type: SearchMetaDto })
  meta!: SearchMetaDto;

  @ApiProperty({
    type: [LessonSearchResultDto],
    description: 'Matching lessons (legacy compatibility field)',
  })
  lessons!: LessonSearchResultDto[];

  @ApiProperty({
    type: [MaterialSearchResultDto],
    description: 'Matching materials (legacy compatibility field)',
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
