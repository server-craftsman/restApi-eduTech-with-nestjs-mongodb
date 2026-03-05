import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber } from 'class-validator';

/**
 * DTO to send the generated link code to parent via SMS or Zalo
 * Student provides parent's phone number
 */
export class SendLinkCodeDto {
  @ApiProperty({
    description:
      'Parent phone number to send link code via SMS/Zalo (E.164 format)',
    example: '+84901234567',
  })
  @IsString()
  @IsPhoneNumber('VN', { message: 'Invalid Vietnam phone number' })
  parentPhoneNumber!: string;

  @ApiProperty({
    enum: ['sms', 'zalo'],
    description: 'Send via SMS or Zalo',
    example: 'sms',
  })
  @IsString()
  channel!: 'sms' | 'zalo';
}
