import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Type, Transform } from 'class-transformer';
import { Chapter } from '../domain/chapter';

/**
 * FilterChapterDto — all fields optional; combine freely.
 * Pass as JSON string: `filters={"courseId":"507f1f77bcf86cd799439011","isPublished":true}`
 */
export class FilterChapterDto {
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
  isDeleted?: boolean | null;
}

/**
 * SortChapterDto — one sort criterion; supply an **array** for multi-column sort.
 * `sort=[{"orderBy":"orderIndex","order":"asc"}]`
 */
export class SortChapterDto {
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
  orderBy: keyof Chapter;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'asc' })
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';
}

/**
 * QueryChapterDto — pagination + filtering + sorting
 */
export class QueryChapterDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1, example: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

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
