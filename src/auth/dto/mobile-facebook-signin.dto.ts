import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { UserRole, GradeLevel } from '../../enums';

/**
 * DTO for Facebook Sign-In from React Native (Mobile)
 * React Native app receives accessToken from Facebook SDK,
 * sends it to backend for verification and JWT token generation.
 */
export class MobileFacebookSignInDto {
  @ApiProperty({
    description:
      'Facebook Access Token from react-native-fbsdk-next package. ' +
      'Verify this token server-side to extract user info.',
    example: 'EAACEdEose0cBAO...',
  })
  @IsString()
  accessToken!: string;

  @ApiPropertyOptional({
    description:
      'Facebook User ID (optional - can be extracted from access token)',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  userId?: string;

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
