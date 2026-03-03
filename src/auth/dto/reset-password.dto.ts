import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'One-time reset token received in the OTP verification response. Valid for 60 minutes.',
    example: 'a3f2c1e9d8b74502...',
  })
  @IsString()
  resetToken!: string;

  @ApiProperty({
    description:
      'New password. Minimum 8 characters, must include at least one uppercase letter, one lowercase letter, and one digit.',
    example: 'NewPass@2026',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  newPassword!: string;
}
