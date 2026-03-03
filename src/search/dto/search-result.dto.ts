import { ApiProperty } from '@nestjs/swagger';

export class LessonSearchResultDto {
  @ApiProperty({
    description: 'ID bài học',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  id!: string;

  @ApiProperty({
    description: 'ID chương học',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  chapterId!: string;

  @ApiProperty({
    description: 'Tiêu đề bài học',
    example: 'Hàm số bậc hai và đồ thị',
  })
  title!: string;

  @ApiProperty({
    description: 'Mô tả bài học',
    example: 'Học về hàm số bậc hai, đỉnh, trục đối xứng...',
  })
  description!: string;

  @ApiProperty({
    description: 'URL video bài giảng',
    example: 'https://res.cloudinary.com/...',
  })
  videoUrl!: string;

  @ApiProperty({ description: 'Thời lượng video (giây)', example: 1800 })
  durationSeconds!: number;

  @ApiProperty({
    description: 'Nội dung lý thuyết (Markdown)',
    example: '## Hàm số bậc hai\n...',
  })
  contentMd!: string;

  @ApiProperty({ description: 'Bài học xem trước miễn phí', example: false })
  isPreview!: boolean;

  @ApiProperty({ description: 'Thứ tự trong chương', example: 3 })
  orderIndex!: number;

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}

export class MaterialSearchResultDto {
  @ApiProperty({
    description: 'ID tài liệu',
    example: '64f1a2b3c4d5e6f7a8b9c0d3',
  })
  id!: string;

  @ApiProperty({
    description: 'ID bài học liên kết',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  lessonId!: string;

  @ApiProperty({
    description: 'Tiêu đề tài liệu',
    example: 'Tóm tắt lý thuyết Hàm số bậc hai',
  })
  title!: string;

  @ApiProperty({
    description: 'URL tải tài liệu',
    example: 'https://res.cloudinary.com/...pdf',
  })
  fileUrl!: string;

  @ApiProperty({
    description: 'Loại tài liệu (pdf, docx, pptx...)',
    example: 'pdf',
  })
  type!: string;

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Từ khóa đã tìm kiếm', example: 'Hàm số' })
  keyword!: string;

  @ApiProperty({
    type: [LessonSearchResultDto],
    description: 'Danh sách bài học phù hợp',
  })
  lessons!: LessonSearchResultDto[];

  @ApiProperty({
    type: [MaterialSearchResultDto],
    description: 'Danh sách tài liệu phù hợp',
  })
  materials!: MaterialSearchResultDto[];

  @ApiProperty({ description: 'Tổng số bài học tìm thấy', example: 5 })
  totalLessons!: number;

  @ApiProperty({ description: 'Tổng số tài liệu tìm thấy', example: 3 })
  totalMaterials!: number;

  @ApiProperty({
    description: 'Tổng số kết quả (lessons + materials)',
    example: 8,
  })
  total!: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Số kết quả mỗi trang', example: 10 })
  limit!: number;
}
