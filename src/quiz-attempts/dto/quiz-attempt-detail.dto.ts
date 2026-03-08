import { ApiProperty } from '@nestjs/swagger';
import { QuizAttemptAnswerDto } from './quiz-attempt.dto';
import { LessonDto } from '../../lessons/dto/lesson.dto';
import { QuestionDto } from '../../questions/dto/question.dto';

/**
 * Answer detail with question information
 */
export class QuizAttemptAnswerDetailDto extends QuizAttemptAnswerDto {
  @ApiProperty({
    description: 'Question detail information',
    type: QuestionDto,
  })
  question!: QuestionDto;
}

/**
 * Quiz Attempt with enriched lesson and question details
 * Returned by GET endpoints instead of basic QuizAttemptDto
 * Includes all properties from QuizAttemptDto plus lesson and answers with question details
 */
export class QuizAttemptDetailDto {
  @ApiProperty({
    description: 'Quiz attempt ID',
    example: '507f1f77bcf86cd799439001',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID of student',
    example: '507f1f77bcf86cd799439011',
  })
  userId!: string;

  @ApiProperty({
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439014',
  })
  lessonId!: string;

  @ApiProperty({
    description: 'Lesson information',
    type: LessonDto,
  })
  lesson!: LessonDto;

  @ApiProperty({
    description: 'Answers with full question details',
    type: [QuizAttemptAnswerDetailDto],
  })
  answers!: QuizAttemptAnswerDetailDto[];

  @ApiProperty({
    description: 'Score achieved (0-100)',
    example: 85,
  })
  score!: number;

  @ApiProperty({
    description: 'Total questions in the quiz',
    example: 10,
  })
  totalQuestions!: number;

  @ApiProperty({
    description: 'Number of correct answers',
    example: 8,
  })
  correctAnswers!: number;

  @ApiProperty({
    description: 'Total time spent on quiz in milliseconds',
    example: 600000,
  })
  totalTimeSpentMs!: number;

  @ApiProperty({
    description: 'Status of the attempt',
    enum: ['submitted', 'graded', 'in-progress'],
    example: 'graded',
  })
  status!: 'submitted' | 'graded' | 'in-progress';

  @ApiProperty({
    description: 'When the attempt was submitted',
    example: '2024-02-26T21:00:00Z',
  })
  submittedAt!: Date;

  @ApiProperty({
    description: 'When the attempt was graded',
    example: '2024-02-26T21:30:00Z',
    nullable: true,
  })
  gradedAt?: Date | null;

  @ApiProperty({
    description: 'Soft delete flag',
    example: false,
  })
  isDeleted!: boolean;

  @ApiProperty({
    description: 'When the record was soft-deleted',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-02-26T20:50:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-02-26T21:30:00Z',
  })
  updatedAt!: Date;
}
