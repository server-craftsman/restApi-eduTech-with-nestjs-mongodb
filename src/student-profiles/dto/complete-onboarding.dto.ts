import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { GradeLevel } from '../../enums';

/**
 * Payload sent by the student to complete the onboarding questionnaire.
 *
 * After a successful call to `POST /student-profiles/onboarding`:
 *  - `gradeLevel` is persisted on the StudentProfile.
 *  - `preferredSubjectIds` are stored so the Dashboard and content endpoints
 *    can surface only the most relevant courses and lessons.
 *  - `onboardingCompleted` is flipped to `true`, unlocking the full Dashboard.
 */
export class CompleteOnboardingDto {
  /**
   * The student's current school grade.
   * This is the primary signal used to filter out irrelevant content
   * (e.g., a Grade-12 student will not see Grade-6 courses).
   */
  @ApiProperty({
    enum: GradeLevel,
    enumName: 'GradeLevel',
    description:
      'Current grade of the student — used to personalise all content.',
    example: GradeLevel.Grade12,
  })
  @IsEnum(GradeLevel)
  @IsNotEmpty()
  gradeLevel!: GradeLevel;

  @ApiPropertyOptional({
    type: String,
    description: 'Full name (updates the profile name if supplied).',
    example: 'Nguyễn Văn An',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'School name.',
    example: 'THPT Nguyễn Du',
  })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'List of subject IDs the student is interested in. ' +
      'Used to rank recommended courses on the Dashboard.',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSubjectIds?: string[];
}
