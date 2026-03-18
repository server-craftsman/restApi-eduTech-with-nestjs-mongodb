import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseCreateDto } from '../../core/dto';
import { IconUrlDto } from './icon-url.dto';

export class CreateSubjectDto extends BaseCreateDto {
  @ApiProperty({
    description:
      'Subject name — slug is automatically generated from this field (supports Vietnamese)',
    example: 'Toán Học',
    minLength: 3,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty({ message: 'Subject name is required' })
  @MinLength(3, { message: 'Subject name must be at least 3 characters long' })
  @MaxLength(120, { message: 'Subject name must not exceed 120 characters' })
  name!: string;

  @ApiProperty({
    description:
      'Subject icon from Cloudinary. ' +
      'First upload via POST /uploads?subfolder=subjects, ' +
      'then paste the returned publicId and url here.',
    type: IconUrlDto,
  })
  @IsNotEmpty({ message: 'Subject icon is required' })
  @ValidateNested({ message: 'Icon URL must contain publicId and url' })
  @Type(() => IconUrlDto)
  iconUrl!: IconUrlDto;
}
