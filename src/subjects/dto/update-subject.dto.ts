import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IconUrlDto } from './icon-url.dto';

export class UpdateSubjectDto {
  @ApiPropertyOptional({
    description:
      'Subject name — slug will be automatically regenerated when this changes',
    example: 'Toán Học Nâng Cao',
    minLength: 3,
    maxLength: 120,
  })
  @IsString({ message: 'Subject name must be a string' })
  @IsOptional()
  @MinLength(3, { message: 'Subject name must be at least 3 characters long' })
  @MaxLength(120, { message: 'Subject name must not exceed 120 characters' })
  name?: string;

  @ApiPropertyOptional({
    description:
      'Updated subject icon. Upload new file via POST /uploads, then paste returned publicId and url.',
    type: IconUrlDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IconUrlDto)
  iconUrl?: IconUrlDto;
}
