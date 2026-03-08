import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionDto } from '../../questions/dto/question.dto';

/**
 * Base response DTO for a WrongAnswer record.
 */
export class WrongAnswerDto {
  @ApiProperty({
    description: 'WrongAnswer record ID',
    example: '507f1f77bcf86cd799439001',
  })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  userId!: string;

  @ApiProperty({
    description: 'Question ID',
    example: '507f1f77bcf86cd799439022',
  })
  questionId!: string;

  @ApiProperty({
    description: 'Lesson ID this question belongs to',
    example: '507f1f77bcf86cd799439014',
  })
  lessonId!: string;

  @ApiProperty({
    description: 'Number of times answered incorrectly',
    example: 3,
  })
  failCount!: number;

  @ApiProperty({
    description: 'Timestamp of last wrong answer',
    example: '2026-03-08T10:00:00Z',
  })
  lastFailedAt!: Date;

  @ApiProperty({
    description: 'True when student answers correctly (mastered)',
    example: false,
  })
  isMastered!: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when mastered',
    example: null,
    nullable: true,
  })
  masteredAt?: Date | null;

  @ApiProperty({ description: 'Soft-delete flag', example: false })
  isDeleted!: boolean;

  @ApiPropertyOptional({ nullable: true })
  deletedAt?: Date | null;

  @ApiProperty({ example: '2026-03-08T10:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-03-08T10:00:00Z' })
  updatedAt!: Date;
}

/**
 * WrongAnswer enriched with the full Question object.
 * Returned by GET /wrong-answers/my-bank so the student can see
 * what they need to study.
 */
export class WrongAnswerWithQuestionDto extends WrongAnswerDto {
  @ApiProperty({
    type: () => QuestionDto,
    description: 'Full question details',
  })
  question!: QuestionDto;
}
