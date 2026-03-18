import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseUpdateDto } from '../../core/dto';
import { TeacherEducationLevel } from '../../enums';

export class UpdateTeacherProfileDto extends BaseUpdateDto {
  @ApiPropertyOptional({
    description: 'Teacher full name',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Teacher bio',
    example: 'Updated bio information',
  })
  @IsString()
  @IsOptional()
  bio?: string | null;

  // ── Approval-review fields ─────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Phone number for admin contact and verification',
    example: '+84987654321',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of subjects the teacher is qualified to teach',
    example: ['Mathematics', 'Chemistry'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjectsTaught?: string[];

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of years of teaching experience',
    example: 10,
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
    example: TeacherEducationLevel.PhD,
  })
  @IsEnum(TeacherEducationLevel)
  @IsOptional()
  educationLevel?: TeacherEducationLevel | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'URLs of uploaded teaching certificates / credentials',
    example: ['https://example.com/cert2.pdf'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certificateUrls?: string[];

  @ApiPropertyOptional({
    description: 'URL of the uploaded CV / résumé document',
    example: 'https://example.com/updated-cv.pdf',
  })
  @IsString()
  @IsOptional()
  cvUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Optional LinkedIn profile URL',
    example: 'https://linkedin.com/in/janedoe',
  })
  @IsString()
  @IsOptional()
  linkedinUrl?: string | null;
}
