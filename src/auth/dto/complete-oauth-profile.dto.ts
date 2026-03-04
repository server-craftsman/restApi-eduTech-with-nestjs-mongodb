import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  UserRole,
  TeacherEducationLevel,
  ParentRelationship,
} from '../../enums';

export class CompleteOAuthProfileDto {
  @ApiProperty({
    description:
      'Short-lived token returned when the OAuth callback responds with needsProfileCompletion = true.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  completionToken!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    description:
      'Desired role. Defaults to STUDENT (immediate session). TEACHER/PARENT enter pending-approval.',
    default: UserRole.Student,
    example: UserRole.Teacher,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // ── Identity — required for TEACHER / PARENT ────────────────────────────────

  @ApiPropertyOptional({
    example: 'Nguyen',
    description: 'Required when role = TEACHER',
  })
  @ValidateIf((o: CompleteOAuthProfileDto) => o.role === UserRole.Teacher)
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Van A',
    description: 'Required when role = TEACHER',
  })
  @ValidateIf((o: CompleteOAuthProfileDto) => o.role === UserRole.Teacher)
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  // ── Parent-specific (all optional) ─────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Phone number (optional for PARENT)',
    example: '+84912345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: ParentRelationship,
    enumName: 'ParentRelationship',
    description: 'Relationship to student (optional for PARENT)',
    example: ParentRelationship.Mother,
  })
  @IsOptional()
  @IsEnum(ParentRelationship)
  relationship?: ParentRelationship;

  @ApiPropertyOptional({
    description: 'National ID card number (CCCD/CMND — optional for PARENT)',
    example: '079200012345',
  })
  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  // ── Teacher-specific ────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: [String],
    description:
      'Subjects the teacher is qualified to teach — required when role = TEACHER',
    example: ['Mathematics', 'Physics'],
  })
  @ValidateIf((o: CompleteOAuthProfileDto) => o.role === UserRole.Teacher)
  @IsArray()
  @IsString({ each: true })
  subjectsTaught?: string[];

  @ApiPropertyOptional({
    type: Number,
    description: 'Years of teaching experience — required when role = TEACHER',
    example: 5,
    minimum: 0,
    maximum: 60,
  })
  @ValidateIf((o: CompleteOAuthProfileDto) => o.role === UserRole.Teacher)
  @IsNumber()
  @Min(0)
  @Max(60)
  @Type(() => Number)
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    enum: TeacherEducationLevel,
    enumName: 'TeacherEducationLevel',
    description: 'Highest education level — required when role = TEACHER',
    example: TeacherEducationLevel.Master,
  })
  @ValidateIf((o: CompleteOAuthProfileDto) => o.role === UserRole.Teacher)
  @IsEnum(TeacherEducationLevel)
  educationLevel?: TeacherEducationLevel;
}
