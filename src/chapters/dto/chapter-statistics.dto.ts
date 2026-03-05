import { ApiProperty } from '@nestjs/swagger';

/**
 * Response shape for GET /chapters/admin/stats
 */
export class ChapterStatisticsDto {
  @ApiProperty({
    description: 'Total non-deleted chapters',
    example: 24,
  })
  total!: number;

  @ApiProperty({
    description: 'Published chapters',
    example: 20,
  })
  published!: number;

  @ApiProperty({
    description: 'Draft (unpublished) chapters',
    example: 4,
  })
  draft!: number;

  @ApiProperty({
    description: 'Soft-deleted chapters (isDeleted = true)',
    example: 2,
  })
  deleted!: number;

  @ApiProperty({
    description: 'Chapters grouped by published status',
    example: { published: 20, draft: 4 },
  })
  byPublished!: Record<string, number>;
}
