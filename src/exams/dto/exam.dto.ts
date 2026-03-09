import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamScope } from '../../enums';

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

  // ── Ownership / Context ────────────────────────────────────────────────

  @ApiProperty({
    enum: ExamScope,
    enumName: 'ExamScope',
    description: '"course" = cuối khoá học | "chapter" = cuối chương',
    example: ExamScope.Chapter,
  })
  scope!: ExamScope;

  @ApiProperty({
    description: 'ID khoá học mà đề thi thuộc về',
    example: '665f1f77bcf86cd799439020',
  })
  courseId!: string;

  @ApiPropertyOptional({
    description: 'ID chương — chỉ có khi scope = "chapter"',
    example: '665f1f77bcf86cd799439021',
    nullable: true,
  })
  chapterId?: string | null;

  @ApiProperty({
    description: 'userId của giáo viên / admin đã tạo đề thi',
    example: '507f1f77bcf86cd799439011',
  })
  createdBy!: string;

  // ── Content ────────────────────────────────────────────────────────────

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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
