import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Base pagination query parameters DTO
 * Used for paginated list endpoints
 */
export class BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * Base paginated response DTO
 * Generic response wrapper for paginated data
 *
 * @template T - The type of items in the paginated response
 *
 * @example
 * class UserDtoPagedResponse extends BasePaginatedResponseDto<UserDto> {}
 */
export class BasePaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data!: T[];

  @ApiProperty({
    description: 'Total number of items (ignoring pagination)',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 15,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Has next page',
    example: true,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'Has previous page',
    example: false,
  })
  hasPreviousPage!: boolean;

  constructor(partial?: Partial<BasePaginatedResponseDto<T>>) {
    Object.assign(this, partial);
  }
}

/**
 * Helper function to create paginated response
 * @param data - Array of items
 * @param total - Total count
 * @param page - Current page
 * @param limit - Items per page
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): BasePaginatedResponseDto<T> {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return new BasePaginatedResponseDto({
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  });
}
