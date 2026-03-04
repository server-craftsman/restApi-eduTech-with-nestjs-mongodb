import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional({
    description: 'Teacher full name',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Teacher bio',
    example: 'Updated bio information',
  })
  @IsString()
  @IsOptional()
  bio?: string | null;
}
