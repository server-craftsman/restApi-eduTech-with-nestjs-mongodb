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
import { Subject } from '../domain/subject';

/**
 * FilterSubjectDto — all fields optional; pass as JSON-encoded string.
 * Example: `filters={"name":"ợn","isDeleted":false}`
 */
export class FilterSubjectDto {
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
  isDeleted?: boolean | null;
}

/**
 * SortSubjectDto — one sort criterion; supply as array for multi-column sort.
 * Example: `sort=[{"orderBy":"name","order":"asc"}]`
 */
export class SortSubjectDto {
  @ApiProperty({
    type: String,
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['id', 'name', 'slug', 'isDeleted', 'createdAt', 'updatedAt'],
  })
  @IsString()
  orderBy!: keyof Subject;

  @ApiProperty({
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort direction',
  })
  @IsEnum(['asc', 'desc'])
  order!: 'asc' | 'desc';
}

export class QuerySubjectDto {
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
