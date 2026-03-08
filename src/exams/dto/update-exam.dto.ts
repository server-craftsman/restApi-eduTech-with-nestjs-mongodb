import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Payload for partially updating an exam (Teacher / Admin only).
 * All fields optional — only supplied fields are updated.
 */
export class UpdateExamDto {
  @ApiPropertyOptional({
    description: 'Exam title',
    example: 'Đề thi thử Toán học – Chương 3 (Cập nhật)',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional description / instructions',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Replace the full ordered list of Question IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionIds?: string[];

  @ApiPropertyOptional({
    description: 'Time limit in seconds',
    minimum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  timeLimitSeconds?: number;

  @ApiPropertyOptional({
    description: 'Passing score threshold (0–100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    description: 'Publish / un-publish the exam',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
