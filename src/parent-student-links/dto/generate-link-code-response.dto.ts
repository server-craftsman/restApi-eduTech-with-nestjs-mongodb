import { ApiProperty } from '@nestjs/swagger';

/** Response returned when a student generates a link code */
export class GenerateLinkCodeResponseDto {
  @ApiProperty({
    description:
      '8-character uppercase alphanumeric code to share with a parent',
    example: 'A3BX7K2M',
  })
  linkCode!: string;

  @ApiProperty({
    description:
      'UTC timestamp when this code expires (24 hours from generation)',
    example: '2025-01-01T12:00:00.000Z',
  })
  expiresAt!: Date;
}
