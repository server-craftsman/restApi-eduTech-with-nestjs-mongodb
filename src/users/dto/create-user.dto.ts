import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
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
  TeacherEducationLevel,
  ParentRelationship,
} from '../../enums';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 8,
    description: 'Plain password — will be hashed by the service',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    default: UserRole.Student,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // ── Identity ────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'First name — required when role = TEACHER',
    example: 'Nguyen',
  })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.Teacher)
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name — required when role = TEACHER',
    example: 'Van A',
  })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.Teacher)
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  // ── Common optional ─────────────────────────────────────────────────────────

  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsString()
  // @MaxLength(512)
  // avatarUrl?: string;

  // @ApiPropertyOptional({ default: true })
  // @IsOptional()
  // @IsBoolean()
  // isActive?: boolean;

  // @ApiPropertyOptional({
  //   enum: EmailVerificationStatus,
  //   enumName: 'EmailVerificationStatus',
  //   description: 'Leave unset — service auto-sets Verified for admin-created accounts',
  // })
  // @IsOptional()
  // @IsEnum(EmailVerificationStatus)
  // emailVerificationStatus?: EmailVerificationStatus | null;

  // ── Parent-specific ─────────────────────────────────────────────────────────

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
    description: 'National ID number (CCCD/CMND — optional for PARENT)',
    example: '079200012345',
  })
  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  // ── Teacher-specific ────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: [String],
    description: 'Subjects taught — required when role = TEACHER',
    example: ['Mathematics', 'Physics'],
  })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.Teacher)
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
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.Teacher)
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
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.Teacher)
  @IsEnum(TeacherEducationLevel)
  educationLevel?: TeacherEducationLevel;
}
