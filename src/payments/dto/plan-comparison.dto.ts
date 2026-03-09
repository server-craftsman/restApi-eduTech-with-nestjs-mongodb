import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A single benefit row in the plan comparison table.
 */
export class PlanBenefitDto {
  @ApiProperty({ description: 'Benefit label', example: 'Truy cập bài học' })
  label!: string;

  @ApiProperty({
    description: 'Availability on Free tier',
    example: 'Giới hạn 5 bài/ngày',
  })
  free!: string;

  @ApiProperty({
    description: 'Availability on Pro tier',
    example: 'Không giới hạn',
  })
  pro!: string;
}

/**
 * Pricing info for a specific period (Monthly / Yearly).
 */
export class PlanPricingDto {
  @ApiProperty({ description: 'Subscription plan document ID' })
  planId!: string;

  @ApiProperty({ description: 'Period label', example: 'MONTHLY' })
  period!: string;

  @ApiProperty({ description: 'Price (VND)', example: 99000 })
  price!: number;

  @ApiPropertyOptional({
    description: 'Original price before discount (VND)',
    example: 1188000,
    nullable: true,
  })
  originalPrice?: number | null;

  @ApiProperty({ description: 'Duration in days', example: 30 })
  durationDays!: number;
}

/**
 * Full comparison response for the "Choose your plan" screen.
 */
export class PlanComparisonResponseDto {
  @ApiProperty({
    description: 'Benefit comparison rows',
    type: [PlanBenefitDto],
  })
  benefits!: PlanBenefitDto[];

  @ApiProperty({
    description: 'Available Pro pricing options',
    type: [PlanPricingDto],
  })
  pricing!: PlanPricingDto[];

  @ApiProperty({
    description: 'Is the current user already on Pro?',
    example: false,
  })
  isCurrentlyPro!: boolean;
}
