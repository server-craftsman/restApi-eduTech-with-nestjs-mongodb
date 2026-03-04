import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  UserRole,
  GradeLevel,
  TeacherEducationLevel,
  ParentRelationship,
} from '../../enums';

export class SignUpDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Str0ngP@ss' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.Student,
    description: 'STUDENT (default) | PARENT | TEACHER',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // ── Student-specific ───────────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: GradeLevel,
    description: 'Required when role = STUDENT',
    example: GradeLevel.Grade10,
  })
  @IsOptional()
  @IsEnum(GradeLevel)
  gradeLevel?: GradeLevel;

  // ── Parent-specific ────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Phone number — required when role = PARENT',
    example: '+84912345678',
  })
  @ValidateIf((o: SignUpDto) => o.role === UserRole.Parent)
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: ParentRelationship,
    enumName: 'ParentRelationship',
    description: 'Relationship to student — required when role = PARENT',
    example: ParentRelationship.Mother,
  })
  @ValidateIf((o: SignUpDto) => o.role === UserRole.Parent)
  @IsEnum(ParentRelationship)
  relationship?: ParentRelationship;

  @ApiPropertyOptional({
    description:
      'National ID card number (CCCD/CMND) — required when role = PARENT',
    example: '079200012345',
  })
  @ValidateIf((o: SignUpDto) => o.role === UserRole.Parent)
  @IsString()
  nationalIdNumber?: string;

  // ── Teacher-specific ───────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: [String],
    description:
      'Subjects the teacher is qualified to teach — required when role = TEACHER',
    example: ['Mathematics', 'Physics'],
  })
  @ValidateIf((o: SignUpDto) => o.role === UserRole.Teacher)
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
  @ValidateIf((o: SignUpDto) => o.role === UserRole.Teacher)
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
  @ValidateIf((o: SignUpDto) => o.role === UserRole.Teacher)
  @IsEnum(TeacherEducationLevel)
  educationLevel?: TeacherEducationLevel;
}
