import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFacebookTestTokenDto {
  @ApiPropertyOptional({
    description:
      'Requested Facebook permissions for the generated test user token',
    type: [String],
    example: ['email', 'public_profile'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Optional display name for the Facebook test user',
    example: 'Edutech Mobile QA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
