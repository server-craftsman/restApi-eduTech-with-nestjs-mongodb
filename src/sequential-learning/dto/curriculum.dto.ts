import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** A question as returned to the student — correctAnswer is NEVER exposed */
export class QuestionForStudentDto {
  @ApiProperty({
    description: 'Question ID',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  id!: string;

  @ApiProperty({
    description: 'Question body in HTML format',
    example: '<p>What is the powerhouse of the cell?</p>',
  })
  contentHtml!: string;

  @ApiProperty({
    description: 'Question type',
    enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK'],
    example: 'MULTIPLE_CHOICE',
  })
  type!: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ['EASY', 'MEDIUM', 'HARD'],
    example: 'EASY',
  })
  difficulty!: string;

  @ApiProperty({
    description:
      'Answer options (labels for MULTIPLE_CHOICE, e.g. ["A","B","C","D"])',
    example: ['A. Mitochondria', 'B. Nucleus', 'C. Ribosome', 'D. Vacuole'],
    type: [String],
  })
  options!: string[];
}

/** One lesson in the curriculum tree, enriched with student progress state */
export class LessonInCurriculumDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  id!: string;

  @ApiProperty({ example: 'Introduction to Photosynthesis' })
  title!: string;

  @ApiProperty({ example: 'An overview of how plants make food.' })
  description!: string;

  @ApiProperty({ description: 'Display order within the chapter', example: 1 })
  orderIndex!: number;

  @ApiProperty({ description: 'Total video duration in seconds', example: 600 })
  durationSeconds!: number;

  @ApiProperty({
    description: 'Whether this lesson is freely previewable without enrollment',
    example: false,
  })
  isPreview!: boolean;

  @ApiProperty({
    description:
      'Whether the lesson is locked for the student (previous lesson not completed)',
    example: false,
  })
  isLocked!: boolean;

  @ApiProperty({
    description: 'Whether the student has finished watching the video',
    example: true,
  })
  videoWatched!: boolean;

  @ApiProperty({
    description: 'Whether the student has passed the quiz',
    example: false,
  })
  quizCompleted!: boolean;

  @ApiPropertyOptional({
    description: 'Best quiz score (0–100). Null if not yet attempted.',
    example: null,
    nullable: true,
  })
  quizScore?: number | null;

  @ApiProperty({
    description: 'Full lesson completion (video + quiz passed >= 80%)',
    example: false,
  })
  isCompleted!: boolean;
}

/** One chapter in the curriculum tree, with its nested lessons */
export class ChapterInCurriculumDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0c1' })
  id!: string;

  @ApiProperty({ example: 'Chapter 1: Plant Biology Basics' })
  title!: string;

  @ApiProperty({ description: 'Display order within the course', example: 1 })
  orderIndex!: number;

  @ApiProperty({ description: 'Number of completed lessons', example: 2 })
  completedLessons!: number;

  @ApiProperty({
    description: 'Total number of lessons in this chapter',
    example: 5,
  })
  totalLessons!: number;

  @ApiProperty({ type: [LessonInCurriculumDto] })
  lessons!: LessonInCurriculumDto[];
}

/**
 * Full curriculum tree for a course with per-lesson student progress.
 * Step 1 of the learning flow — student selects a lesson from this view.
 */
export class CurriculumDto {
  @ApiProperty({
    description: 'Course ID',
    example: '64f1a2b3c4d5e6f7a8b9c0b1',
  })
  courseId!: string;

  @ApiProperty({
    description: 'Total number of lessons across all chapters',
    example: 20,
  })
  totalLessons!: number;

  @ApiProperty({
    description: 'Total completed lessons by this student',
    example: 4,
  })
  completedLessons!: number;

  @ApiProperty({
    description: 'Overall course completion percentage for the student',
    example: 20,
  })
  overallProgressPercent!: number;

  @ApiProperty({ type: [ChapterInCurriculumDto] })
  chapters!: ChapterInCurriculumDto[];
}
