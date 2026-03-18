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
  BaseSortDto,
  BasePaginationQueryDto,
} from '../../core/dto';
import { Subject } from '../domain/subject';

/**
 * FilterSubjectDto — all fields optional; pass as JSON-encoded string.
 * Example: `filters={"name":"ợn","isDeleted":false}`
 */
export class FilterSubjectDto extends BaseFilterDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive name search',
    example: 'Toán',
  })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Exact slug match',
    example: 'toan-hoc',
  })
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive slug search',
    example: 'toan',
  })
  @IsOptional()
  @IsString()
  slugContains?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Set true to view soft-deleted records (Admin audit only)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true'
      ? true
      : value === 'false'
        ? false
        : (value as boolean | null),
  )
  declare isDeleted?: boolean | null;
}

/**
 * SortSubjectDto — one sort criterion; supply as array for multi-column sort.
 * Example: `sort=[{"orderBy":"name","order":"asc"}]`
 */
export class SortSubjectDto extends BaseSortDto {
  @ApiProperty({
    type: String,
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['id', 'name', 'slug', 'isDeleted', 'createdAt', 'updatedAt'],
  })
  @IsString()
  declare orderBy: keyof Subject;

  @ApiProperty({
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort direction',
  })
  @IsEnum(['asc', 'desc'])
  declare order: 'asc' | 'desc';
}

export class QuerySubjectDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded FilterSubjectDto. Example: `{"name":"toán","isDeleted":false}`',
    example: '{"name":"toán"}',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(FilterSubjectDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterSubjectDto)
  filters?: FilterSubjectDto | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded SortSubjectDto[]. Example: `[{"orderBy":"name","order":"asc"}]`',
    example: '[{"orderBy":"createdAt","order":"desc"}]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(SortSubjectDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortSubjectDto)
  sort?: SortSubjectDto[] | null;
}
