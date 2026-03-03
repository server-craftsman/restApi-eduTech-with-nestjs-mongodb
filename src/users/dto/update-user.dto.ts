import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, EmailVerificationStatus } from '../../enums';

export class UpdateUserDto {
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
}
