import { ApiProperty } from '@nestjs/swagger';

export class SeedLearningDataResultDto {
  @ApiProperty({ example: 5 })
  subjects!: number;

  @ApiProperty({ example: 1 })
  gradeLevels!: number;

  @ApiProperty({ example: 5 })
  courses!: number;

  @ApiProperty({ example: 15 })
  chapters!: number;

  @ApiProperty({ example: 45 })
  lessons!: number;

  @ApiProperty({ example: 135 })
  materials!: number;

  @ApiProperty({ example: 135 })
  quizQuestions!: number;

  @ApiProperty({ example: 15 })
  chapterQuizzes!: number;

  @ApiProperty({ example: 15 })
  chapterExams!: number;

  @ApiProperty({ example: 5 })
  finalExams!: number;
}

export class SeedLearningDataResponseDto {
  @ApiProperty({ type: SeedLearningDataResultDto })
  created!: SeedLearningDataResultDto;

  @ApiProperty({ type: SeedLearningDataResultDto })
  reused!: SeedLearningDataResultDto;

  @ApiProperty({
    example:
      'Seed completed: 5 subjects, 5 courses, each course with 3 chapters, each chapter with 3 lessons, 3 materials/lesson, and chapter/final exams.',
  })
  summary!: string;
}
