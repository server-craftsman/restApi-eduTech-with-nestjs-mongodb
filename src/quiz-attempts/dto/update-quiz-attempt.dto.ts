import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';

/**
 * Update Quiz Attempt DTO
 * Used by ADMIN to update/grade quiz attempts
 * Students cannot update their own attempts
 */
export class UpdateQuizAttemptDto {
  @ApiPropertyOptional({
    description: 'Updated score (0-100)',
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({
    description: 'Updated number of correct answers',
    example: 9,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  correctAnswers?: number;

  @ApiPropertyOptional({
    description: 'Status of the attempt',
    enum: ['submitted', 'graded', 'in-progress'],
    example: 'graded',
  })
  @IsEnum(['submitted', 'graded', 'in-progress'])
  @IsOptional()
  status?: 'submitted' | 'graded' | 'in-progress';

  @ApiPropertyOptional({
    description: 'Grading notes or feedback',
    example: 'Good effort, review question 5',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  gradingNotes?: string;
}
