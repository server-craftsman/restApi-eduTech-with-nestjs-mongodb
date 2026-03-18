import { ApiProperty } from '@nestjs/swagger';
import { BaseStatisticsDto } from '../../core/dto';

/**
 * Response shape for GET /chapters/admin/stats
 */
export class ChapterStatisticsDto extends BaseStatisticsDto {
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
    description: 'Chapters grouped by published status',
    example: { published: 20, draft: 4 },
  })
  byPublished!: Record<string, number>;
}
