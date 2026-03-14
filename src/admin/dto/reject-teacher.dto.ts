import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectTeacherDto {
  @ApiProperty({
    description: 'Reason for rejection — will be sent to the teacher.',
    example: 'Hồ sơ chưa đầy đủ, vui lòng bổ sung bằng cấp chuyên môn.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}
