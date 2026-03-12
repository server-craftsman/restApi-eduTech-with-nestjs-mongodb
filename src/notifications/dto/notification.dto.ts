import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../../enums';

/**
 * Response DTO — mirrors the Notification domain interface.
 */
export class NotificationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  userId!: string;

  @ApiProperty({ example: 'Bạn đã nhận được 10 điểm thưởng!' })
  title!: string;

  @ApiProperty({ example: 'Hoàn thành bài học Toán chương 3.' })
  message!: string;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({
    enum: NotificationType,
    enumName: 'NotificationType',
    example: NotificationType.PointsEarned,
  })
  type!: NotificationType;

  @ApiPropertyOptional({
    nullable: true,
    example: '/courses/abc123/lessons/xyz',
  })
  actionUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: { courseId: 'abc123', points: 10 },
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ example: false })
  emailSent!: boolean;

  @ApiProperty({ example: '2026-03-12T10:00:00.000Z' })
  createdAt!: Date;
}
