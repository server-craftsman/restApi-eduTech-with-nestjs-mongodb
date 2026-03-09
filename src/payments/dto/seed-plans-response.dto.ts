import { ApiProperty } from '@nestjs/swagger';

export class SeedPlansResponseDto {
  @ApiProperty({
    type: [String],
    description: 'Plan names created during this seed run',
    example: ['free', 'pro_monthly', 'pro_yearly'],
  })
  created!: string[];

  @ApiProperty({
    type: [String],
    description: 'Plan names updated during this seed run',
    example: ['free'],
  })
  updated!: string[];

  @ApiProperty({
    description: 'Total default plans processed',
    example: 3,
  })
  total!: number;
}
