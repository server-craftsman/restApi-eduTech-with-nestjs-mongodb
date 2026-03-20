import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsPhoneNumber,
  IsEmail,
  IsOptional,
  ValidateIf,
} from 'class-validator';

/**
 * DTO to send the generated link code to parent via SMS or Zalo
 * Student provides parent's phone number
 */
export class SendLinkCodeDto {
  @ApiProperty({
    enum: ['email', 'zalo'],
    description: 'Delivery channel for parent link code',
    example: 'email',
  })
  @IsString()
  channel!: 'email' | 'zalo';

  @ApiProperty({
    description: 'Parent email (required when channel=email)',
    example: 'phuhuynh@example.com',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: SendLinkCodeDto) => o.channel === 'email')
  @IsEmail({}, { message: 'Invalid parent email' })
  @IsString()
  parentEmail?: string;

  @ApiProperty({
    description: 'Parent phone number (required when channel=zalo)',
    example: '+84901234567',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: SendLinkCodeDto) => o.channel === 'zalo')
  @IsPhoneNumber('VN', { message: 'Invalid Vietnam phone number' })
  @IsString()
  parentPhoneNumber?: string;

  @ApiProperty({
    description: 'Optional parent display name for personalised message',
    example: 'Chị Lan',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentName?: string;
}
