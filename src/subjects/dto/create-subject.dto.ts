import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IconUrlDto } from './icon-url.dto';

export class CreateSubjectDto {
  @ApiProperty({
    description:
      'Subject name — slug is automatically generated from this field (supports Vietnamese)',
    example: 'Toán Học',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    description:
      'Subject icon from Cloudinary. ' +
      'First upload via POST /uploads?subfolder=subjects, ' +
      'then paste the returned publicId and url here.',
    type: IconUrlDto,
  })
  @ValidateNested()
  @Type(() => IconUrlDto)
  iconUrl!: IconUrlDto;
}
