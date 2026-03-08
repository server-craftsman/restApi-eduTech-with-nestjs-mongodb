import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, Difficulty } from '../../enums';

/**
 * A question stripped of the correct answer and explanation.
 * Returned to students during an active exam session (GET /exams/:id/start).
 */
export class QuestionForExamDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  id!: string;

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

  @ApiProperty({
    description: 'Answer options (for MC / True-False questions)',
    type: [String],
    example: ['x² + 2x + 1 = 0', '3x + 5 = 0', 'x³ = 0', '√x = 2'],
  })
  options!: string[];

  @ApiPropertyOptional({ example: 10 })
  points?: number;
}

/**
 * Response returned when a student starts an exam.
 * Contains exam metadata and sanitised questions (no answers/explanations).
 */
export class StartExamResponseDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439001' })
  examId!: string;

  @ApiProperty({ example: 'Đề thi thử Toán học – Chương 3' })
  title!: string;

  @ApiPropertyOptional({ example: 'Hãy đọc kỹ câu hỏi trước khi chọn đáp án.' })
  description?: string | null;

  @ApiProperty({
    example: 1800,
    description: 'Seconds — use this as the countdown timer',
  })
  timeLimitSeconds!: number;

  @ApiProperty({ example: 10 })
  totalQuestions!: number;

  @ApiProperty({ example: 50 })
  passingScore!: number;

  @ApiProperty({
    description: 'Sanitised questions (no correctAnswer / explanation)',
    type: [QuestionForExamDto],
  })
  questions!: QuestionForExamDto[];
}
