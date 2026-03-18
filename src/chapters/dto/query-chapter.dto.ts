import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Type, Transform } from 'class-transformer';
import {
  BaseFilterDto,
  BaseSortDto,
  BasePaginationQueryDto,
} from '../../core/dto';
import { Chapter } from '../domain/chapter';

/**
 * FilterChapterDto — all fields optional; combine freely.
 * Pass as JSON string: `filters={"courseId":"507f1f77bcf86cd799439011","isPublished":true}`
 */
export class FilterChapterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filter by course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  courseId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive match on title',
    example: 'introduction',
  })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by published status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  isPublished?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Set true to view soft-deleted records (Admin audit only)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  declare isDeleted?: boolean | null;
}

/**
 * SortChapterDto — one sort criterion; supply an **array** for multi-column sort.
 * `sort=[{"orderBy":"orderIndex","order":"asc"}]`
 */
export class SortChapterDto extends BaseSortDto {
  @ApiProperty({
    type: String,
    example: 'orderIndex',
    enum: [
      'id',
      'courseId',
      'title',
      'orderIndex',
      'isPublished',
      'isDeleted',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsString()
  declare orderBy: keyof Chapter;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'asc' })
  @IsEnum(['asc', 'desc'])
  declare order: 'asc' | 'desc';
}

/**
 * QueryChapterDto — pagination + filtering + sorting
 */
export class QueryChapterDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded FilterChapterDto. Example: `{"courseId":"507f1f77bcf86cd799439011","isPublished":true}`',
    example: '{"isPublished":true}',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(
          FilterChapterDto,
          JSON.parse(value as string) as Record<string, unknown>,
        )
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterChapterDto)
  filters?: FilterChapterDto | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded SortChapterDto[]. Example: `[{"orderBy":"orderIndex","order":"asc"}]`',
    example: '[{"orderBy":"orderIndex","order":"asc"}]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(
          SortChapterDto,
          JSON.parse(value as string) as Record<string, unknown>[],
        )
      : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortChapterDto)
  sort?: SortChapterDto[] | null;
}
