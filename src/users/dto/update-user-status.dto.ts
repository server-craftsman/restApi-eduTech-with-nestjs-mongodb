import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { BasePatchDto } from '../../core/dto';

export class UpdateUserStatusDto extends BasePatchDto {
  @ApiProperty({
    description: 'Set the active status of the user explicitly.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
