import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, Difficulty } from '../../enums';

/**
 * DTO for question response
 */
export class QuestionDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439012',
  })
  lessonId!: string;

  @ApiProperty({
    description: 'Question content in HTML',
    example: '<p>What is the capital of France?</p>',
  })
  contentHtml!: string;

  @ApiProperty({
    description: 'Question type',
    enum: QuestionType,
    enumName: 'QuestionType',
    example: QuestionType.MultipleChoice,
  })
  type!: QuestionType;

  @ApiProperty({
    description: 'Difficulty level',
    enum: Difficulty,
    enumName: 'Difficulty',
    example: Difficulty.Medium,
  })
  difficulty!: Difficulty;

  @ApiProperty({
    description: 'Answer options',
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    isArray: true,
  })
  options!: string[];

  @ApiProperty({
    description: 'Correct answer',
    example: '0',
  })
  correctAnswer!: string;

  @ApiProperty({
    description: 'Explanation',
    example: 'Paris is the capital of France...',
  })
  explanation!: string;

  @ApiPropertyOptional({
    description: 'Topic tags',
    example: ['geography', 'capitals'],
    isArray: true,
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Points for correct answer',
    example: 10,
  })
  points?: number;

  @ApiProperty({
    description: 'Soft-delete flag',
    example: false,
  })
  isDeleted!: boolean;

  @ApiProperty({
    description: 'Soft-delete timestamp',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-03-05T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-03-05T11:00:00Z',
  })
  updatedAt!: Date;
}
