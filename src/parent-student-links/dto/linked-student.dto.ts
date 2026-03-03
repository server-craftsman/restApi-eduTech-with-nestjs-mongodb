import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeLevel } from '../../enums';

/** Student profile data returned in parent → my-children endpoint */
export class LinkedStudentDto {
  @ApiProperty({
    description: 'Parent-student link record ID',
    example: '507f1f77bcf86cd799439011',
  })
  linkId!: string;

  @ApiProperty({
    description: 'Student profile ID',
    example: '507f1f77bcf86cd799439012',
  })
  studentProfileId!: string;

  @ApiProperty({ description: "Student's full name", example: 'Nguyen Van A' })
  fullName!: string;

  @ApiPropertyOptional({
    enum: GradeLevel,
    enumName: 'GradeLevel',
    description: "Student's current grade level",
    nullable: true,
  })
  gradeLevel?: GradeLevel | null;

  @ApiPropertyOptional({ description: "Student's school name", nullable: true })
  schoolName?: string | null;

  @ApiProperty({
    description: 'Total XP accumulated by the student',
    example: 1240,
  })
  xpTotal!: number;

  @ApiProperty({ description: 'Current daily streak (days)', example: 7 })
  currentStreak!: number;

  @ApiProperty({
    description: 'Link creation date',
    example: '2025-01-01T00:00:00.000Z',
  })
  linkedAt!: Date;
}
