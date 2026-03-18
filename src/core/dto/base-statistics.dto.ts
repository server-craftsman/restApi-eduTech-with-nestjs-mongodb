import { ApiProperty } from '@nestjs/swagger';

/**
 * Base statistics DTO for aggregate data
 * Used for admin dashboard endpoints that show counts and breakdowns
 *
 * @example
 * export class UserStatisticsDto extends BaseStatisticsDto {
 *   byRole!: Record<string, number>;
 *   byVerificationStatus!: Record<string, number>;
 * }
 */
export class BaseStatisticsDto {
  @ApiProperty({
    description: 'Total count of non-deleted records',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Count of soft-deleted records',
    example: 5,
  })
  deleted!: number;

  @ApiProperty({
    description: 'Percentage of deleted records (0-100)',
    example: 3.33,
  })
  deletedPercentage!: number;

  @ApiProperty({
    description: 'Count of active (non-deleted) records',
    example: 145,
  })
  active!: number;

  @ApiProperty({
    description: 'Percentage of active records (0-100)',
    example: 96.67,
  })
  activePercentage!: number;
}

/**
 * Base breakdown statistics for grouped counts
 * Use for per-role, per-status, per-category breakdowns
 */
export class BaseBreakdownStatisticsDto {
  @ApiProperty({
    type: Object,
    description: 'Breakdown of counts by category',
    example: {
      STUDENT: 100,
      TEACHER: 40,
      ADMIN: 5,
    },
  })
  breakdown!: Record<string, number>;

  @ApiProperty({
    description: 'Total count across all categories',
    example: 145,
  })
  total!: number;
}
