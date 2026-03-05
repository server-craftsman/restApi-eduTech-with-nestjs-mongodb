import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { QuestionType, Difficulty } from '../../enums';

/**
 * DTO for creating a new question
 * Only TEACHER and ADMIN can create questions
 */
export class CreateQuestionDto {
  @ApiPropertyOptional({
    description: 'Lesson ID this question belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Lesson ID must be a string' })
  @IsOptional()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Quiz ID this question belongs to',
    example: '507f1f77bcf86cd799439021',
  })
  @IsString({ message: 'Quiz ID must be a string' })
  @IsOptional()
  quizId?: string;

  @ApiProperty({
    description: 'Question content in HTML format',
    example: '<p>What is the capital of France?</p>',
    minLength: 5,
    maxLength: 5000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(5, { message: 'Content must be at least 5 characters' })
  @MaxLength(5000, { message: 'Content must not exceed 5000 characters' })
  contentHtml!: string;

  @ApiProperty({
    description: 'Type of question',
    enum: QuestionType,
    enumName: 'QuestionType',
    example: QuestionType.MultipleChoice,
  })
  @IsEnum(QuestionType, { message: 'Type must be a valid question type' })
  @IsNotEmpty({ message: 'Type is required' })
  type!: QuestionType;

  @ApiProperty({
    description: 'Difficulty level',
    enum: Difficulty,
    enumName: 'Difficulty',
    example: Difficulty.Medium,
  })
  @IsEnum(Difficulty, {
    message: 'Difficulty must be a valid difficulty level',
  })
  @IsNotEmpty({ message: 'Difficulty is required' })
  difficulty!: Difficulty;

  @ApiProperty({
    description: 'Array of answer options',
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    isArray: true,
  })
  @IsArray({ message: 'Options must be an array' })
  @IsNotEmpty({ message: 'Options are required' })
  options!: string[];

  @ApiProperty({
    description: 'Correct answer (index or value)',
    example: '0',
  })
  @IsString({ message: 'Correct answer must be a string' })
  @IsNotEmpty({ message: 'Correct answer is required' })
  correctAnswer!: string;

  @ApiProperty({
    description: 'Explanation for the correct answer',
    example:
      'Paris is the capital city of France, located in the north-central part of the country.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString({ message: 'Explanation must be a string' })
  @IsNotEmpty({ message: 'Explanation is required' })
  @MinLength(10, { message: 'Explanation must be at least 10 characters' })
  @MaxLength(2000, { message: 'Explanation must not exceed 2000 characters' })
  explanation!: string;

  @ApiPropertyOptional({
    description: 'Topic tags for categorizing questions',
    example: ['geography', 'capitals', 'europe'],
    isArray: true,
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Points awarded for correct answer (1-100)',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt({ message: 'Points must be an integer' })
  @Min(1, { message: 'Points must be at least 1' })
  @Max(100, { message: 'Points must not exceed 100' })
  @IsOptional()
  points?: number;
}
