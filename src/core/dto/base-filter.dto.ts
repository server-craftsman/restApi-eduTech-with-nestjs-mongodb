import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

const toBooleanOrNull = (value: unknown): boolean | null | undefined => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === null || value === undefined) return value;
  return undefined;
};

/**
 * Base filter DTO for list queries
 * All custom FilterDtos should extend this to include isDeleted soft-delete filtering
 *
 * @example
 * export class FilterUserDto extends BaseFilterDto {
 *   @IsOptional()
 *   @IsEnum(UserRole, { each: true })
 *   @IsArray()
 *   roles?: UserRole[];
 * }
 */
export class BaseFilterDto {
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Set to true to view soft-deleted records (Admin audit only). Default: false (show only active)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanOrNull(value))
  isDeleted?: boolean | null;
}

/**
 * Base sort DTO for list queries
 * Supports multi-column sorting with orderBy + order
 */
export class BaseSortDto {
  @ApiProperty({
    type: String,
    description: 'Field name to sort by',
    example: 'createdAt',
  })
  @IsString()
  orderBy!: string;

  @ApiProperty({
    enum: ['asc', 'desc'],
    description: 'Sort direction',
    example: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  order!: 'asc' | 'desc';

  constructor(partial?: Partial<BaseSortDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Base query DTO combining pagination + filters + sort
 * Reduces endpoint proliferation by consolidating filter/sort params into one endpoint
 *
 * @example
 * GET /users?page=1&limit=10&filters={"roles":["ADMIN"],"isActive":true}&sort=[{"orderBy":"createdAt","order":"desc"}]
 */
export class BaseQueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  limit?: number;
}

/**
 * Response shape for filter statistics (breakdown counts)
 * Used when clients need to know available filter values and their counts
 *
 * @example
 * {
 *   "roles": {
 *     "STUDENT": 150,
 *     "TEACHER": 30,
 *     "ADMIN": 5
 *   },
 *   "status": {
 *     "ACTIVE": 170,
 *     "INACTIVE": 15
 *   }
 * }
 */
export interface FilterStatistics {
  [filterName: string]: {
    [value: string]: number;
  };
}
