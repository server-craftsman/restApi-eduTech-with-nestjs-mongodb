import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single answer submitted by the student.
 * `isCorrect` is NOT accepted — computed server-side.
 */
export class ExamAnswerInputDto {
  @ApiProperty({
    description: 'Question ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Selected answer text or index',
    example: 'Paris',
  })
  @IsNotEmpty()
  selectedAnswer!: string | string[];

  @ApiPropertyOptional({
    description: 'Time spent on this question in milliseconds',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentMs?: number;
}

/**
 * Payload for submitting exam answers (Student).
 * userId is extracted from JWT — NOT included here.
 */
export class SubmitExamDto {
  @ApiProperty({
    description: 'Array of answers for each question',
    type: [ExamAnswerInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswerInputDto)
  answers!: ExamAnswerInputDto[];

  @ApiProperty({
    description: 'Total wall-clock time the student spent on the exam (ms)',
    example: 900000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  totalTimeSpentMs!: number;
}
