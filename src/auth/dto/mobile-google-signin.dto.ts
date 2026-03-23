import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { UserRole, GradeLevel } from '../../enums';

/**
 * DTO for Google Sign-In from React Native (Mobile)
 * React Native app receives idToken from Google Sign-In SDK,
 * sends it to backend for verification and JWT token generation.
 */
export class MobileGoogleSignInDto {
  @ApiProperty({
    description:
      'Google ID Token from react-native-google-signin package. ' +
      'Verify this token server-side to extract user info.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ...',
  })
  @IsString()
  idToken!: string;

  @ApiPropertyOptional({
    description: 'Optional - User role. Defaults to STUDENT if not provided.',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.Student,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Student only - Grade level (e.g., "GRADE_10")',
    enum: GradeLevel,
    enumName: 'GradeLevel',
  })
  @IsOptional()
  @IsEnum(GradeLevel)
  gradeLevel?: GradeLevel;

  @ApiPropertyOptional({
    description: 'Device identifier (e.g., device UUID)',
    example: 'device-uuid-123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Device name/model (e.g., "iPhone 14", "Samsung Galaxy S23")',
    example: 'iPhone 14',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;
}
