import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeType } from '../../enums';

/** One badge in the catalog with its requirement and display metadata. */
export class BadgeCatalogItemDto {
  @ApiProperty({
    enum: BadgeType,
    enumName: 'BadgeType',
    example: BadgeType.Scholar,
  })
  badge!: BadgeType;

  @ApiProperty({ example: 'Học bá', description: 'Human-readable badge name' })
  label!: string;

  @ApiProperty({
    example: 'Tích lũy đủ 1000 điểm thưởng',
    description: 'Unlock description',
  })
  description!: string;

  @ApiProperty({
    example: 1000,
    description: 'Minimum totalPoints required to unlock',
  })
  minPoints!: number;
}

/** Summary of a student's current reward status. */
export class MyRewardsDto {
  @ApiProperty({
    example: 1250,
    description: 'Total accumulated reward points',
  })
  totalPoints!: number;

  @ApiProperty({
    enum: BadgeType,
    enumName: 'BadgeType',
    isArray: true,
    example: [BadgeType.FirstStep, BadgeType.Diligent, BadgeType.Scholar],
    description: 'Badges already unlocked by this student',
  })
  badges!: BadgeType[];

  @ApiPropertyOptional({
    type: BadgeCatalogItemDto,
    description:
      'The next badge this student can unlock (null if all badges earned)',
    nullable: true,
  })
  nextBadge?: BadgeCatalogItemDto | null;

  @ApiPropertyOptional({
    example: 750,
    description:
      'Points still needed to unlock the next badge (null if all earned)',
    nullable: true,
  })
  pointsToNextBadge?: number | null;
}
