import { ApiProperty } from '@nestjs/swagger';

/**
 * Response shape for `POST /ai-assistant/training/train`.
 *
 * Reports how many approved training entries were vectorised
 * by the local embedding model.
 */
export class TrainModelResponseDto {
  @ApiProperty({
    description: 'Total approved training entries found',
    example: 50,
  })
  total!: number;

  @ApiProperty({
    description: 'Entries successfully embedded in this run',
    example: 42,
  })
  embedded!: number;

  @ApiProperty({
    description: 'Entries skipped (already had an embedding vector)',
    example: 8,
  })
  skipped!: number;

  @ApiProperty({
    description: 'Entries that failed during embedding generation',
    example: 0,
  })
  errors!: number;

  @ApiProperty({
    description: 'The local embedding model used',
    example: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
  })
  model!: string;

  @ApiProperty({
    description: 'Total processing time in milliseconds',
    example: 12500,
  })
  processingTimeMs!: number;
}
