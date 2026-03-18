import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseUpdateDto } from '../../core/dto';
import { UserRole, EmailVerificationStatus, ApprovalStatus } from '../../enums';

export class UpdateUserDto extends BaseUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @ApiPropertyOptional({ enum: UserRole, enumName: 'UserRole' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: EmailVerificationStatus,
    enumName: 'EmailVerificationStatus',
  })
  @IsOptional()
  @IsEnum(EmailVerificationStatus)
  emailVerificationStatus?: EmailVerificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailVerificationToken?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  emailVerificationExpires?: Date | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passwordResetOtp?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passwordResetToken?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  passwordResetExpires?: Date | null;

  @ApiPropertyOptional({
    enum: ApprovalStatus,
    enumName: 'ApprovalStatus',
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({
    description: 'Reason for approval rejection (Teacher/Parent only)',
    example: 'Missing required documentation',
  })
  @IsOptional()
  @IsString()
  approvalRejectionReason?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp of the last approval review action',
  })
  @IsOptional()
  approvalReviewedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'ID of the admin user who performed the last review action',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  approvalReviewedBy?: string | null;
}
