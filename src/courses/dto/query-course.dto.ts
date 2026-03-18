import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  BaseFilterDto,
  BaseSortDto,
  BasePaginationQueryDto,
} from '../../core/dto';
import { Course } from '../domain/course';
import { CourseStatus, CourseType } from '../../enums';

const toBooleanOrNull = (value: unknown): boolean | null | undefined => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === null || value === undefined) return value;
  return undefined;
};

/**
 * FilterCourseDto — all fields optional; combine freely.
 * Pass as JSON string: `filters={"status":"Published","subjectId":"xxx"}`
 */
export class FilterCourseDto extends BaseFilterDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filter by subject ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  subjectId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by grade level ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  gradeLevelId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by author (teacher) ID',
    example: '507f1f77bcf86cd799439013',
  })
  @IsOptional()
  @IsString()
  authorId?: string | null;

  @ApiPropertyOptional({
    enum: CourseStatus,
    enumName: 'CourseStatus',
    example: CourseStatus.Published,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus | null;

  @ApiPropertyOptional({
    enum: CourseType,
    enumName: 'CourseType',
    example: CourseType.Free,
  })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive match on title or description',
    example: 'Mathematics',
  })
  @IsOptional()
  @IsString()
  search?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Admin audit only: set true to include soft-deleted courses',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanOrNull(value))
  declare isDeleted?: boolean | null;
}

/**
 * SortCourseDto — one sort criterion; supply an **array** for multi-column sort.
 * `sort=[{"orderBy":"createdAt","order":"desc"},{"orderBy":"title","order":"asc"}]`
 */
export class SortCourseDto extends BaseSortDto {
  @ApiProperty({
    type: String,
    example: 'createdAt',
    enum: ['title', 'status', 'type', 'createdAt', 'updatedAt'],
  })
  @IsString()
  declare orderBy: keyof Course;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc' })
  @IsEnum(['asc', 'desc'])
  declare order: 'asc' | 'desc';
}

export class QueryCourseDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded FilterCourseDto. Example: `{"status":"Published","subjectId":"xxx"}`',
    example: '{"status":"Published"}',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(FilterCourseDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterCourseDto)
  filters?: FilterCourseDto | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded SortCourseDto[]. Example: `[{"orderBy":"createdAt","order":"desc"}]`',
    example: '[{"orderBy":"createdAt","order":"desc"}]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(SortCourseDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortCourseDto)
  sort?: SortCourseDto[] | null;
}
