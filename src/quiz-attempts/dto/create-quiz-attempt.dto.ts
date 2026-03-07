import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Individual answer submitted by the student.
 * isCorrect is NOT accepted — computed server-side.
 */
export class SubmitAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Selected answer (text or value)',
    example: 'Paris',
  })
  @IsNotEmpty()
  selectedAnswer!: string | string[];

  @ApiPropertyOptional({
    description: 'Time spent on this question in milliseconds',
    example: 5000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeSpentMs?: number;
}

/**
 * Create Quiz Attempt DTO
 * Used when a student submits quiz answers for a lesson.
 * score, correctAnswers, totalQuestions, isCorrect are computed server-side.
 * userId is extracted from JWT token — NOT accepted in the body.
 */
export class CreateQuizAttemptDto {
  @ApiProperty({
    description: 'Lesson ID the quiz belongs to',
    example: '507f1f77bcf86cd799439014',
  })
  @IsString()
  @IsNotEmpty()
  lessonId!: string;

  @ApiProperty({
    description: 'Array of student answers for each question',
    type: [SubmitAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];

  @ApiProperty({
    description: 'Total time spent on quiz in milliseconds',
    example: 600000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  totalTimeSpentMs!: number;
}
