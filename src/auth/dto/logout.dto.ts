import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Session ID to revoke (omit to revoke current session)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
