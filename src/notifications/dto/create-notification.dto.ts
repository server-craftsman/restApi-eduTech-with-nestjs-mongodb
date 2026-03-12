import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { NotificationType } from '../../enums';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Bài học mới đã sẵn sàng!',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Bài học Toán lớp 10 chương 3 đã được thêm vào khóa học của bạn.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    enumName: 'NotificationType',
    example: NotificationType.NewAssignment,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiPropertyOptional({
    description: 'Deep link URL — opens target screen directly',
    example: '/courses/abc123/lessons/xyz',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Extra metadata (courseId, examId, badge, etc.)',
    example: { courseId: 'abc123', lessonId: 'xyz' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Also send email notification',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}
