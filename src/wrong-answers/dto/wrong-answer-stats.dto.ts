import { ApiProperty } from '@nestjs/swagger';

/**
 * Statistics for a student's wrong-answer bank.
 * Returned by GET /wrong-answers/my-bank/stats.
 */
export class WrongAnswerStatsDto {
  @ApiProperty({
    description: 'Total wrong questions ever recorded (non-deleted)',
    example: 20,
  })
  total!: number;

  @ApiProperty({
    description: 'Questions the student has mastered (answered correctly)',
    example: 8,
  })
  mastered!: number;

  @ApiProperty({ description: 'Questions still needing practice', example: 12 })
  remaining!: number;

  @ApiProperty({
    description: 'Mastery rate as a percentage (0-100)',
    example: 40,
  })
  masteryRate!: number;
}
