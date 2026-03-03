import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Comprehensive status of a lesson for a specific student.
 * Used to drive the UI state (video watched? quiz button lit? locked?).
 */
export class LessonStatusDto {
  @ApiProperty({
    description: 'Lesson ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  lessonId!: string;

  @ApiProperty({
    description:
      'Whether the student has completed watching the video (reached end or >= 90%)',
    example: true,
  })
  videoWatched!: boolean;

  @ApiProperty({
    description: 'Current video playback position in seconds',
    example: 540,
  })
  videoCurrentTime!: number;

  @ApiProperty({ description: 'Total video duration in seconds', example: 600 })
  videoDuration!: number;

  @ApiProperty({
    description: 'Overall progress percentage (0–100)',
    example: 90,
  })
  progressPercent!: number;

  @ApiProperty({
    description:
      'Whether the student can now access the quiz (video must be watched first)',
    example: true,
  })
  canAccessQuiz!: boolean;

  @ApiProperty({
    description: 'Whether the student has completed the quiz for this lesson',
    example: false,
  })
  quizCompleted!: boolean;

  @ApiPropertyOptional({
    description:
      'Best quiz score achieved (0–100). Null if quiz not attempted.',
    example: 85,
    nullable: true,
  })
  quizScore?: number | null;

  @ApiProperty({
    description:
      'Whether this lesson is fully completed (video watched + quiz passed >= 80%)',
    example: true,
  })
  isCompleted!: boolean;

  @ApiProperty({
    description:
      'Whether this lesson is locked (previous lesson not completed)',
    example: false,
  })
  isLocked!: boolean;
}
