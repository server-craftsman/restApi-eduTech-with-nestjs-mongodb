import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** One answer submitted by the student */
export class QuizAnswerDto {
  @ApiProperty({
    description: 'ID of the question being answered',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  @IsString()
  questionId!: string;

  @ApiProperty({
    description: 'The answer option selected by the student (e.g. "A", "B")',
    example: 'B',
  })
  @IsString()
  selectedAnswer!: string;
}

/**
 * DTO for submitting all quiz answers for a lesson in a single request.
 * The lesson is identified via the route parameter :lessonId.
 */
export class QuizSubmitDto {
  @ApiProperty({
    description: 'Array of question-answer pairs',
    type: [QuizAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];

  @ApiProperty({
    description: 'Time spent completing the quiz in milliseconds',
    example: 120000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  timeSpentMs!: number;
}
