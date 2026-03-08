import { ApiProperty } from '@nestjs/swagger';

/**
 * Result for one question in a practice session.
 */
export class PracticeResultItemDto {
  @ApiProperty({
    description: 'Question ID',
    example: '507f1f77bcf86cd799439022',
  })
  questionId!: string;

  @ApiProperty({
    description: 'Whether the student answered correctly this time',
    example: true,
  })
  isCorrect!: boolean;

  @ApiProperty({
    description:
      'True when the question has just been mastered (correct answer after being in wrong bank)',
    example: true,
  })
  isMastered!: boolean;

  @ApiProperty({
    description: 'The correct answer — shown for learning feedback',
    example: '0',
  })
  correctAnswer!: string;

  @ApiProperty({ description: 'Answer the student submitted', example: '0' })
  selectedAnswer!: string;

  @ApiProperty({
    description: 'Explanation for the correct answer',
    example: 'Paris is the capital of France because…',
  })
  explanation!: string;
}

/**
 * Full result returned after POST /wrong-answers/practice.
 */
export class PracticeResultDto {
  @ApiProperty({
    description: 'Per-question grading results',
    type: [PracticeResultItemDto],
  })
  results!: PracticeResultItemDto[];

  @ApiProperty({
    description: 'Total number of questions answered',
    example: 5,
  })
  totalAnswered!: number;

  @ApiProperty({
    description: 'Number answered correctly in this session',
    example: 3,
  })
  correctCount!: number;

  @ApiProperty({
    description: 'Questions newly marked as mastered (not previously mastered)',
    example: 2,
  })
  masteredCount!: number;

  @ApiProperty({
    description: 'Questions still in the wrong-answer bank after this session',
    example: 2,
  })
  remainingWrong!: number;
}
