import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, Min } from 'class-validator';

/**
 * DTO for tracking video playback progress.
 * Called periodically while student watches the lesson video.
 */
export class VideoProgressRequestDto {
  @ApiProperty({
    description: 'Lesson ID being watched',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsString()
  lessonId!: string;

  @ApiProperty({
    description: 'Current playback position in seconds',
    example: 245,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  currentTime!: number;

  @ApiProperty({
    description: 'Total video duration in seconds',
    example: 600,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  duration!: number;

  @ApiProperty({
    description:
      'Whether the student has finished watching the video (reached the end)',
    example: false,
  })
  @IsBoolean()
  completed!: boolean;
}
