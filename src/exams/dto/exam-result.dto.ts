import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, Difficulty } from '../../enums';

/**
 * Per-question breakdown in the exam result.
 * Shown after the exam is submitted.
 */
export class ExamAnswerDetailDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  questionId!: string;

  @ApiProperty({
    example: '<p>Phương trình nào sau đây là phương trình bậc hai?</p>',
  })
  contentHtml!: string;

  @ApiProperty({
    enum: QuestionType,
    enumName: 'QuestionType',
    example: QuestionType.MultipleChoice,
  })
  type!: QuestionType;

  @ApiProperty({
    enum: Difficulty,
    enumName: 'Difficulty',
    example: Difficulty.Medium,
  })
  difficulty!: Difficulty;

  @ApiProperty({ type: [String], example: ['x² + 2x + 1 = 0', '3x + 5 = 0'] })
  options!: string[];

  /** What the student chose */
  @ApiProperty({ example: '3x + 5 = 0' })
  selectedAnswer!: string | string[];

  /** The correct answer */
  @ApiProperty({ example: 'x² + 2x + 1 = 0' })
  correctAnswer!: string;

  /** Text explanation of why the correct answer is right */
  @ApiProperty({ example: 'x² + 2x + 1 = 0 là phương trình bậc hai vì...' })
  explanation!: string;

  @ApiProperty({ example: true })
  isCorrect!: boolean;

  @ApiPropertyOptional({ example: 5000 })
  timeSpentMs?: number;

  @ApiProperty({ example: 10 })
  points!: number;

  @ApiProperty({ example: 10, description: 'Points earned (0 if wrong)' })
  pointsEarned!: number;
}

/**
 * Full result returned immediately after exam submission.
 */
export class ExamResultDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439010' })
  attemptId!: string;

  @ApiProperty({ example: '665f1f77bcf86cd799439001' })
  examId!: string;

  @ApiProperty({ example: 'Đề thi thử Toán học – Chương 3' })
  examTitle!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId!: string;

  @ApiProperty({ example: 85, description: 'Score percentage (0–100)' })
  score!: number;

  @ApiProperty({ example: 10 })
  totalQuestions!: number;

  @ApiProperty({ example: 8 })
  correctAnswers!: number;

  @ApiProperty({ example: 50, description: 'Minimum score required to pass' })
  passingScore!: number;

  @ApiProperty({ example: true, description: 'Whether the student passed' })
  passed!: boolean;

  @ApiProperty({ example: 900000, description: 'Time taken in milliseconds' })
  totalTimeSpentMs!: number;

  @ApiProperty({ type: [ExamAnswerDetailDto] })
  details!: ExamAnswerDetailDto[];

  @ApiProperty()
  submittedAt!: Date;
}

/**
 * Summary result (for listing attempts — no per-question details).
 */
export class ExamAttemptSummaryDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439010' })
  attemptId!: string;

  @ApiProperty({ example: '665f1f77bcf86cd799439001' })
  examId!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId!: string;

  @ApiProperty({ example: 85 })
  score!: number;

  @ApiProperty({ example: 10 })
  totalQuestions!: number;

  @ApiProperty({ example: 8 })
  correctAnswers!: number;

  @ApiProperty({ example: true })
  passed!: boolean;

  @ApiProperty({ example: 900000 })
  totalTimeSpentMs!: number;

  @ApiProperty({ enum: ['submitted', 'graded'], example: 'graded' })
  status!: string;

  @ApiProperty()
  submittedAt!: Date;

  @ApiProperty()
  createdAt!: Date;
}
