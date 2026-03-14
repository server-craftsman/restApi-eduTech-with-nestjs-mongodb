import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NovuInboxContextDto {
  @ApiProperty({
    description: 'Novu Inbox public application identifier',
    example: 'cAfLT0g15YGS',
  })
  applicationIdentifier!: string;

  @ApiProperty({
    description: 'Personalized subscriberId derived from authenticated user',
    example: 'edutech_69b2c01a0b131f8a6a1b02b0',
  })
  subscriberId!: string;

  @ApiProperty({
    description: 'Novu realtime websocket URL',
    example: 'wss://socket.novu.co',
  })
  socketUrl!: string;

  @ApiPropertyOptional({
    description:
      'HMAC SHA-256 hash used by Novu secure mode. Null when secure mode is not enabled.',
    nullable: true,
    example: 'c8d9a23702f21cbf7e78838f9f4ecf6c91a3f6cbe2991f8ec8e5a830f2c2e4ad',
  })
  subscriberHash?: string | null;
}
