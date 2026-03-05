import { ApiProperty } from '@nestjs/swagger';

/** Response for GET /parent-student-links/generate-code/share-text */
export class ShareCodeResponseDto {
  @ApiProperty({
    description: '8-character link code',
    example: 'A3BX7K2M',
  })
  linkCode!: string;

  @ApiProperty({
    description: 'UTC timestamp when this code expires',
    example: '2025-01-01T12:00:00.000Z',
  })
  expiresAt!: Date;

  @ApiProperty({
    description:
      'Pre-composed shareable text (copy and send via Zalo / SMS / email)',
    example:
      'Chào bố/mẹ! Để kết nối tài khoản EduTech và theo dõi tiến trình học tập của con, vui lòng:\n1. Tải app EduTech (hoặc truy cập edutech.vn)\n2. Đăng ký / Đăng nhập với tư cách Phụ Huynh\n3. Vào mục "Kết nối với học sinh" → nhập mã: A3BX7K2M\n⏰ Mã có hiệu lực đến 01/01/2025 12:00',
  })
  shareText!: string;
}
