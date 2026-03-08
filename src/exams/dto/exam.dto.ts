import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Exam response DTO — full exam metadata (Admin / Teacher view).
 * Does NOT include question correctAnswer or explanation.
 */
export class ExamDto {
  @ApiProperty({ example: '665f1f77bcf86cd799439001' })
  id!: string;

  @ApiProperty({ example: 'Đề thi thử Toán học – Chương 3' })
  title!: string;

  @ApiPropertyOptional({ example: 'Hãy đọc kỹ câu hỏi trước khi chọn đáp án.' })
  description?: string | null;

  @ApiProperty({
    description: 'Ordered list of question IDs in this exam',
    type: [String],
  })
  questionIds!: string[];

  @ApiProperty({ example: 10 })
  totalQuestions!: number;

  @ApiProperty({ example: 1800 })
  timeLimitSeconds!: number;

  @ApiProperty({ example: 50 })
  passingScore!: number;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
