import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({
    description: 'Session ID',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  userId!: string;

  @ApiProperty({
    description: 'Device info (browser + OS parsed from User-Agent)',
    example: 'Chrome 121 on Windows 10',
  })
  deviceInfo!: string;

  @ApiProperty({
    description: 'IP address of the session origin',
    example: '192.168.1.1',
  })
  ipAddress!: string;

  @ApiProperty({
    description: 'Session expiry timestamp',
    example: '2026-03-10T12:00:00Z',
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2026-03-03T08:00:00Z',
  })
  createdAt!: Date;
}
