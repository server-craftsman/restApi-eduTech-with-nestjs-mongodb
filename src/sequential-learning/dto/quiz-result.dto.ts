import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Per-question breakdown returned after quiz submission */
export class QuizAnswerDetailDto {
  @ApiProperty({
    description: 'Question ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  questionId!: string;

  @ApiProperty({
    description: 'Whether the student answered correctly',
    example: true,
  })
  correct!: boolean;

  @ApiProperty({ description: 'The answer the student selected', example: 'B' })
  selectedAnswer!: string;

  @ApiProperty({
    description: 'The correct answer for this question',
    example: 'B',
  })
  correctAnswer!: string;

  @ApiProperty({
    description: 'Explanation of the correct answer (shown after submission)',
    example: 'Photosynthesis produces glucose and oxygen.',
  })
  explanation!: string;
}

/**
 * Full result returned after the student submits a quiz.
 * Includes score, pass/fail, per-question breakdown, and next lesson info.
 */
export class QuizResultDto {
  @ApiProperty({
    description: 'Overall score as a percentage (0–100)',
    example: 85,
  })
  score!: number;

  @ApiProperty({
    description: 'Total number of questions in the quiz',
    example: 10,
  })
  totalQuestions!: number;

  @ApiProperty({
    description: 'Number of correctly answered questions',
    example: 8,
  })
  correctAnswers!: number;

  @ApiProperty({
    description: 'Whether the student passed (score >= 80%)',
    example: true,
  })
  passed!: boolean;

  @ApiPropertyOptional({
    description:
      'ID of the next lesson unlocked after passing. Null if no next lesson.',
    example: '64f1a2b3c4d5e6f7a8b9c0d3',
    nullable: true,
  })
  nextLessonId?: string | null;

  @ApiPropertyOptional({
    description: 'Title of the next lesson unlocked after passing.',
    example: 'Lesson 3: Cell Division',
    nullable: true,
  })
  nextLessonTitle?: string | null;

  @ApiProperty({
    description: 'Per-question result breakdown',
    type: [QuizAnswerDetailDto],
  })
  details!: QuizAnswerDetailDto[];
}
