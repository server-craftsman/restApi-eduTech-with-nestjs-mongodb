import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ApproveAccountDto {
  @ApiProperty({
    description:
      'MongoDB ObjectId of the Teacher/Parent user account to approve.',
    example: '665f1a2b3c4d5e6f7a8b9c0d',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;
}
