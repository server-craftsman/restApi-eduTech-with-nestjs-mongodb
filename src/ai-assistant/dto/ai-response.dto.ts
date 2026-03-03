import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiResponseDto {
  @ApiProperty({
    description: 'Câu hỏi ban đầu của học sinh',
    example: 'Cho hàm số f(x) = x² - 3x + 2. Tìm các khoảng đơn điệu...',
  })
  question!: string;

  @ApiProperty({
    description: 'Lời giải từ AI (định dạng Markdown)',
    example:
      "## Giải\n\n**Bước 1:** Tính đạo hàm\n\nf'(x) = 2x - 3\n\n**Bước 2:** ...",
  })
  solution!: string;

  @ApiPropertyOptional({
    description: 'Môn học đã cung cấp',
    example: 'Toán học lớp 10',
  })
  subject?: string;

  @ApiProperty({
    description: 'Tổng số token đã sử dụng (prompt + completion)',
    example: 420,
  })
  tokensUsed!: number;

  @ApiProperty({
    description: 'Model AI đã xử lý yêu cầu',
    example: 'gpt-4o-mini',
  })
  model!: string;

  @ApiProperty({
    description: 'Thời gian xử lý yêu cầu (milliseconds)',
    example: 1350,
  })
  processingTimeMs!: number;
}
