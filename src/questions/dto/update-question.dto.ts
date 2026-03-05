import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
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
 * DTO for updating an existing question
 * All fields are optional
 * Only TEACHER and ADMIN can update questions
 */
export class UpdateQuestionDto {
  @ApiPropertyOptional({
    description: 'Question content in HTML format',
    example: '<p>Updated question content</p>',
    minLength: 5,
    maxLength: 5000,
  })
  @IsString({ message: 'Content must be a string' })
  @MinLength(5, { message: 'Content must be at least 5 characters' })
  @MaxLength(5000, { message: 'Content must not exceed 5000 characters' })
  @IsOptional()
  contentHtml?: string;

  @ApiPropertyOptional({
    description: 'Type of question',
    enum: QuestionType,
    enumName: 'QuestionType',
  })
  @IsEnum(QuestionType, { message: 'Type must be a valid question type' })
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: Difficulty,
    enumName: 'Difficulty',
  })
  @IsEnum(Difficulty, { message: 'Difficulty must be a valid level' })
  @IsOptional()
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Array of answer options',
    example: ['Option 1', 'Option 2', 'Option 3'],
    isArray: true,
  })
  @IsArray({ message: 'Options must be an array' })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({
    description: 'Correct answer',
    example: '0',
  })
  @IsString({ message: 'Correct answer must be a string' })
  @IsOptional()
  correctAnswer?: string;

  @ApiPropertyOptional({
    description: 'Explanation for the correct answer',
    example: 'This is why the answer is correct...',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString({ message: 'Explanation must be a string' })
  @MinLength(10, { message: 'Explanation must be at least 10 characters' })
  @MaxLength(2000, { message: 'Explanation must not exceed 2000 characters' })
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Topic tags',
    example: ['tag1', 'tag2'],
    isArray: true,
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Points for correct answer',
    example: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsInt({ message: 'Points must be an integer' })
  @Min(1, { message: 'Points must be at least 1' })
  @Max(100, { message: 'Points must not exceed 100' })
  @IsOptional()
  points?: number;
}
