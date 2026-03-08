import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Payload for creating a new exam (Teacher / Admin only).
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
