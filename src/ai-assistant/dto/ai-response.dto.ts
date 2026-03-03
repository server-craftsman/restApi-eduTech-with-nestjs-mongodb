import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiResponseDto {
  @ApiProperty({
    description: 'The original question submitted by the student',
    example: 'Given f(x) = x² - 3x + 2, find the intervals of monotonicity...',
  })
  question!: string;

  @ApiProperty({
    description: 'AI-generated solution (Markdown format)',
    example:
      "## Solution\n\n**Step 1:** Compute the derivative\n\nf'(x) = 2x - 3\n\n**Step 2:** ...",
  })
  solution!: string;

  @ApiPropertyOptional({
    description: 'Subject provided by the student',
    example: 'Grade 10 Mathematics',
  })
  subject?: string;

  @ApiProperty({
    description: 'Total tokens used (prompt + completion)',
    example: 420,
  })
  tokensUsed!: number;

  @ApiProperty({
    description: 'AI model that processed the request',
    example: 'gemini-2.0-flash',
  })
  model!: string;

  @ApiProperty({
    description: 'Request processing time in milliseconds',
    example: 1350,
  })
  processingTimeMs!: number;
}
