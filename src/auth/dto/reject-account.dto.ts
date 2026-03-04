import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RejectAccountDto {
  @ApiProperty({
    description:
      'MongoDB ObjectId of the Teacher/Parent user account to reject.',
    example: '665f1a2b3c4d5e6f7a8b9c0d',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;

  @ApiProperty({
    description:
      'Reason for rejection — will be included in the notification email sent to the user. ' +
      'Be specific so the user knows what to update before resubmitting.',
    example:
      'Your teaching certificates were not clearly legible. Please upload high-quality scans.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}
