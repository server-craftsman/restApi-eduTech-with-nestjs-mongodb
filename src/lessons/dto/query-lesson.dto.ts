import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  BaseFilterDto,
  BasePaginationQueryDto,
  BaseSortDto,
} from '../../core/dto';
import { Lesson } from '../domain/lesson';

const toBooleanOrNull = (value: unknown): boolean | null | undefined => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === null || value === undefined) return value;
  return undefined;
};

export class FilterLessonDto extends BaseFilterDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filter by chapter ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  chapterId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by course ID (used by my-lessons endpoint)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  courseId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive match on title/description/content',
    example: 'variables',
  })
  @IsOptional()
  @IsString()
  search?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter preview lessons only',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanOrNull(value))
  isPreview?: boolean | null;
}

export class SortLessonDto extends BaseSortDto {
  @ApiProperty({
    type: String,
    example: 'createdAt',
    enum: [
      'title',
      'orderIndex',
      'isPreview',
      'createdAt',
      'updatedAt',
      'chapterId',
    ],
  })
  @IsString()
  declare orderBy: keyof Lesson;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc' })
  @IsEnum(['asc', 'desc'])
  declare order: 'asc' | 'desc';
}

export class QueryLessonDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded FilterLessonDto. Example: `{"courseId":"...","search":"variables","isPreview":false}`',
    example: '{"search":"variables"}',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(FilterLessonDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterLessonDto)
  filters?: FilterLessonDto | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded SortLessonDto[]. Example: `[{"orderBy":"createdAt","order":"desc"}]`',
    example: '[{"orderBy":"createdAt","order":"desc"}]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(SortLessonDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortLessonDto)
  sort?: SortLessonDto[] | null;
}
