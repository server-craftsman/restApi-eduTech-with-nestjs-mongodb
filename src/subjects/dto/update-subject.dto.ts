import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IconUrlDto } from './icon-url.dto';

export class UpdateSubjectDto {
  @ApiPropertyOptional({
    description:
      'Subject name — slug will be automatically regenerated when this changes',
    example: 'Toán Học Nâng Cao',
    maxLength: 120,
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
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
