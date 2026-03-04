import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TeacherEducationLevel, ParentRelationship } from '../../enums';

/**
 * DTO for Teacher accounts resubmitting after rejection.
 * Update any fields the admin flagged as insufficient.
 */
export class ResubmitTeacherDataDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Updated list of subjects the teacher can teach.',
    example: ['Mathematics', 'Physics'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectsTaught?: string[];

  @ApiPropertyOptional({
    type: Number,
    description: 'Updated years of teaching experience.',
    example: 7,
    minimum: 0,
    maximum: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  @Type(() => Number)
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    enum: TeacherEducationLevel,
    enumName: 'TeacherEducationLevel',
    description: 'Updated highest education level.',
    example: TeacherEducationLevel.Master,
  })
  @IsOptional()
  @IsEnum(TeacherEducationLevel)
  educationLevel?: TeacherEducationLevel;

  @ApiPropertyOptional({
    type: [String],
    description: 'Updated URLs to teaching certificate / credential documents.',
    example: ['https://storage.example.com/certs/cert1.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  certificateUrls?: string[];

  @ApiPropertyOptional({
    description: 'Updated URL to CV / résumé document.',
    example: 'https://storage.example.com/cvs/alice-cv.pdf',
  })
  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @ApiPropertyOptional({
    description: 'Updated LinkedIn profile URL.',
    example: 'https://linkedin.com/in/alice-johnson',
  })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description: 'Updated contact phone number.',
    example: '+84912345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

/**
 * DTO for Parent accounts resubmitting after rejection.
 */
export class ResubmitParentDataDto {
  @ApiPropertyOptional({
    enum: ParentRelationship,
    enumName: 'ParentRelationship',
    description: 'Updated relationship to the student.',
    example: ParentRelationship.Father,
  })
  @IsOptional()
  @IsEnum(ParentRelationship)
  relationship?: ParentRelationship;

  @ApiPropertyOptional({
    description: 'Updated national ID card number (CCCD/CMND).',
    example: '079200012345',
  })
  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Updated URL of the national ID card image.',
    example: 'https://storage.example.com/ids/parent-id.jpg',
  })
  @IsOptional()
  @IsUrl()
  nationalIdImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Updated contact phone number.',
    example: '+84912345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

/**
 * Top-level DTO for the POST /auth/resubmit-approval endpoint.
 * The user must authenticate with their password, then provide
 * updated role-specific profile data.
 */
export class ResubmitApprovalDto {
  @ApiProperty({
    description: 'Registered email address of the rejected account.',
    example: 'teacher@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description:
      'Current account password (used to authenticate the resubmission).',
    minLength: 8,
    example: 'Str0ngP@ss',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    type: ResubmitTeacherDataDto,
    description:
      'Updated Teacher profile data. Include only fields you want to change.',
  })
  @IsOptional()
  @Type(() => ResubmitTeacherDataDto)
  teacherData?: ResubmitTeacherDataDto;

  @ApiPropertyOptional({
    type: ResubmitParentDataDto,
    description:
      'Updated Parent profile data. Include only fields you want to change.',
  })
  @IsOptional()
  @Type(() => ResubmitParentDataDto)
  parentData?: ResubmitParentDataDto;
}
