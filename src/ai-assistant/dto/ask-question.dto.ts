import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AskQuestionDto {
  @ApiProperty({
    description:
      'Nội dung câu hỏi hoặc đề bài — copy đề và paste vào đây. ' +
      'AI sẽ phân tích và trả lời từng bước.',
    example:
      'Cho hàm số f(x) = x² - 3x + 2. Tìm các khoảng đơn điệu của hàm số và xác định cực trị nếu có.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(10, { message: 'Câu hỏi phải có ít nhất 10 ký tự' })
  @MaxLength(5000, { message: 'Câu hỏi không được vượt quá 5000 ký tự' })
  question!: string;

  @ApiPropertyOptional({
    description: 'Môn học để AI hiểu ngữ cảnh tốt hơn (tuỳ chọn)',
    example: 'Toán học lớp 10',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({
    description:
      'Mức độ giải thích:\n' +
      '- `brief`: Câu trả lời ngắn gọn, chỉ nêu đáp án chính\n' +
      '- `detailed`: Giải thích từng bước đầy đủ (mặc định)',
    enum: ['brief', 'detailed'],
    default: 'detailed',
    example: 'detailed',
  })
  @IsOptional()
  @IsEnum(['brief', 'detailed'], {
    message: 'explanationLevel phải là "brief" hoặc "detailed"',
  })
  explanationLevel?: 'brief' | 'detailed';
}
