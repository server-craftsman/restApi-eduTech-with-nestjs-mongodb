import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BasePatchDto } from '../../core/dto';
import { CourseStatus } from '../../enums';

export class UpdateCourseStatusDto extends BasePatchDto {
  @ApiProperty({
    description: 'New course status',
    enum: CourseStatus,
    example: CourseStatus.Published,
  })
  @IsEnum(CourseStatus)
  @IsNotEmpty()
  status!: CourseStatus;
}
