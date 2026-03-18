import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BasePatchDto } from '../../core/dto';

export class ReviewCourseDto extends BasePatchDto {
  @ApiPropertyOptional({
    description:
      'Note from Admin (required when rejecting, optional when approving)',
    example: 'Content needs improvement in chapter 2',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
