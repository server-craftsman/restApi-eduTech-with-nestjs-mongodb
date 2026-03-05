import { ApiProperty } from '@nestjs/swagger';
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
 * Individual answer in quiz attempt DTO
 */
export class AnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Selected answer(s)',
    example: 'A',
    type: String,
  })
  @IsNotEmpty()
  selectedAnswer!: string | string[];

  @ApiProperty({
    description: 'Whether answer is correct',
    example: true,
  })
  isCorrect!: boolean;

  @ApiProperty({
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
 * Used when a student submits a quiz
 */
export class CreateQuizAttemptDto {
  @ApiProperty({
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString()
  @IsNotEmpty()
  quizId!: string;

  @ApiProperty({
    description: 'User ID of the student',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Lesson ID (optional)',
    example: '507f1f77bcf86cd799439014',
  })
  @IsString()
  @IsOptional()
  lessonId?: string;

  @ApiProperty({
    description: 'Array of answers for each question',
    type: [AnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @ApiProperty({
    description: 'Total time spent on quiz in milliseconds',
    example: 600000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  totalTimeSpentMs!: number;

  @ApiProperty({
    description: 'Score achieved (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  score!: number;

  @ApiProperty({
    description: 'Total number of questions',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  totalQuestions!: number;

  @ApiProperty({
    description: 'Number of correct answers',
    example: 8,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  correctAnswers!: number;
}
