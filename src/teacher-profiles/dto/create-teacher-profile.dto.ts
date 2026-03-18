import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseCreateDto } from '../../core/dto';
import { TeacherEducationLevel } from '../../enums';

export class CreateTeacherProfileDto extends BaseCreateDto {
  @ApiProperty({
    description: 'User ID this profile belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Teacher full name',
    example: 'John Smith',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Teacher bio',
    example: 'Experienced math teacher with 10 years of experience',
  })
  @IsString()
  @IsOptional()
  bio?: string | null;

  // ── Approval-review fields ─────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Phone number for admin contact and verification',
    example: '+84912345678',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of subjects the teacher is qualified to teach',
    example: ['Mathematics', 'Physics'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjectsTaught?: string[];

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of years of teaching experience',
    example: 5,
    minimum: 0,
    maximum: 60,
  })
  @IsNumber()
  @Min(0)
  @Max(60)
  @Type(() => Number)
  @IsOptional()
  yearsOfExperience?: number | null;

  @ApiPropertyOptional({
    enum: TeacherEducationLevel,
    enumName: 'TeacherEducationLevel',
    description: 'Highest education level attained',
    example: TeacherEducationLevel.Master,
  })
  @IsEnum(TeacherEducationLevel)
  @IsOptional()
  educationLevel?: TeacherEducationLevel | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'URLs of uploaded teaching certificates / credentials',
    example: ['https://example.com/cert1.pdf'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certificateUrls?: string[];

  @ApiPropertyOptional({
    description: 'URL of the uploaded CV / résumé document',
    example: 'https://example.com/cv.pdf',
  })
  @IsString()
  @IsOptional()
  cvUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Optional LinkedIn profile URL',
    example: 'https://linkedin.com/in/johnsmith',
  })
  @IsString()
  @IsOptional()
  linkedinUrl?: string | null;
}
