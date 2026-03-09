import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ExamScope } from '../../enums';

/**
 * Payload for creating a new exam (Teacher / Admin only).
 *
 * Business rules:
 * - `courseId` must reference an existing, non-deleted Course.
 * - When `scope = 'chapter'`, `chapterId` is required and must belong to `courseId`.
 * - When `scope = 'course'`, `chapterId` must be omitted or null.
 */
export class CreateExamDto {
  @ApiProperty({
    description: 'Exam title displayed to students',
    example: 'Đề thi thử Toán học – Chương 3',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional rich-text instructions or description',
    example: 'Hãy đọc kỹ câu hỏi trước khi chọn đáp án.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // ── Scope / Ownership ───────────────────────────────────────────────────

  @ApiProperty({
    enum: ExamScope,
    enumName: 'ExamScope',
    description: '"course" = đề thi cuối khoá, "chapter" = đề thi cuối chương',
    example: ExamScope.Chapter,
  })
  @IsEnum(ExamScope)
  scope!: ExamScope;

  @ApiProperty({
    description: 'ID của khoá học mà đề thi này thuộc về (bắt buộc)',
    example: '665f1f77bcf86cd799439020',
  })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiPropertyOptional({
    description:
      'ID của chương — bắt buộc khi scope = "chapter", bỏ qua khi scope = "course"',
    example: '665f1f77bcf86cd799439021',
  })
  @IsOptional()
  @IsString()
  chapterId?: string;

  // ── Content ─────────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Ordered array of Question IDs to include in this exam',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];

  @ApiProperty({
    description:
      'Duration of the exam in seconds (frontend uses this for the countdown)',
    example: 1800,
    minimum: 60,
  })
  @IsInt()
  @Min(60)
  timeLimitSeconds!: number;

  @ApiPropertyOptional({
    description: 'Minimum score (0–100) required to pass. Defaults to 50.',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    description: 'Whether the exam is immediately visible to students',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
