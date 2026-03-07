import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTrainingDataDto {
  @ApiProperty({
    description: 'The question / user prompt for training',
    example: 'What is the Pythagorean theorem?',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  question!: string;

  @ApiProperty({
    description: 'The ideal answer / assistant response',
    example:
      'The Pythagorean theorem states that in a right triangle, a² + b² = c²...',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(10000)
  answer!: string;

  @ApiPropertyOptional({ description: 'Subject', example: 'Mathematics' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({ description: 'Grade level', example: 'Grade 9' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gradeLevel?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
    example: ['geometry', 'theorem'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
