import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

/**
 * One answer in a practice session.
 */
export class PracticeAnswerDto {
  @ApiProperty({
    description: 'Question ID being answered',
    example: '507f1f77bcf86cd799439022',
  })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Answer selected by the student (index string or text value)',
    example: '0',
  })
  @IsString()
  @IsNotEmpty()
  selectedAnswer!: string;
}

/**
 * Request body for POST /wrong-answers/practice.
 * Student submits (re-)answers for questions from their wrong-answer bank.
 */
export class PracticeSubmitDto {
  @ApiProperty({
    description: 'Array of answers for questions being practiced',
    type: [PracticeAnswerDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one answer is required' })
  @ValidateNested({ each: true })
  @Type(() => PracticeAnswerDto)
  answers!: PracticeAnswerDto[];
}
