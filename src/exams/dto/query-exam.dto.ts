import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Exam } from '../domain/exam';
import { ExamScope } from '../../enums';

const coerceOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
};

const parseJson = <T>(value: unknown): T | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  return JSON.parse(value) as T;
};

export class FilterExamDto {
  @ApiPropertyOptional({ type: String, description: 'Partial title match' })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by creator userId',
  })
  @IsOptional()
  @IsString()
  createdBy?: string | null;

  @ApiPropertyOptional({
    enum: ExamScope,
    enumName: 'ExamScope',
    description: 'Filter by exam scope (course-level or chapter-level)',
  })
  @IsOptional()
  @IsEnum(ExamScope)
  scope?: ExamScope | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'Filter by courseId — returns all exams belonging to this course',
    example: '665f1f77bcf86cd799439020',
  })
  @IsOptional()
  @IsString()
  courseId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by chapterId — returns exams scoped to this chapter',
    example: '665f1f77bcf86cd799439021',
  })
  @IsOptional()
  @IsString()
  chapterId?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by publish state',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => coerceOptionalBoolean(value))
  isPublished?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Set true to view soft-deleted exams (Admin only)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => coerceOptionalBoolean(value))
  isDeleted?: boolean | null;
}

export class SortExamDto {
  @ApiProperty({
    type: String,
    example: 'createdAt',
    enum: [
      'id',
      'title',
      'scope',
      'courseId',
      'timeLimitSeconds',
      'passingScore',
      'isPublished',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsString()
  orderBy!: keyof Exam;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc' })
  @IsString()
  order!: 'asc' | 'desc';
}

export class QueryExamDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 10, minimum: 1, maximum: 100 })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON-encoded FilterExamDto. Example: `{"isPublished":true}`',
  })
  @IsOptional()
  @Transform(({ value }) =>
    plainToInstance(FilterExamDto, parseJson<Record<string, unknown>>(value)),
  )
  @ValidateNested()
  @Type(() => FilterExamDto)
  filters?: FilterExamDto | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded SortExamDto[]. Example: `[{"orderBy":"createdAt","order":"desc"}]`',
  })
  @IsOptional()
  @Transform(({ value }) =>
    plainToInstance(
      SortExamDto,
      parseJson<Array<Record<string, unknown>>>(value),
    ),
  )
  @ValidateNested({ each: true })
  @Type(() => SortExamDto)
  sort?: SortExamDto[] | null;
}
