import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AskQuestionDto {
  @ApiProperty({
    description:
      'The question or problem statement — copy the problem text and paste it here. ' +
      'The AI will analyze it and answer step by step.',
    example:
      'Given f(x) = x² - 3x + 2, find the intervals of monotonicity and identify any local extrema.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(10, { message: 'Question must be at least 10 characters' })
  @MaxLength(5000, { message: 'Question must not exceed 5000 characters' })
  question!: string;

  @ApiPropertyOptional({
    description: 'Subject name to give the AI better context (optional)',
    example: 'Grade 10 Mathematics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({
    description:
      'Explanation detail level:\n' +
      '- `brief`: Short answer focusing on the key result only\n' +
      '- `detailed`: Full step-by-step explanation (default)',
    enum: ['brief', 'detailed'],
    default: 'detailed',
    example: 'detailed',
  })
  @IsOptional()
  @IsEnum(['brief', 'detailed'], {
    message: 'explanationLevel must be "brief" or "detailed"',
  })
  explanationLevel?: 'brief' | 'detailed';
}
