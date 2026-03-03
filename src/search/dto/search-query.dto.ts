import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SearchType {
  All = 'all',
  Lessons = 'lessons',
  Materials = 'materials',
}

export class SearchQueryDto {
  @ApiProperty({
    description:
      'Từ khóa tìm kiếm (ví dụ: "Hàm số", "Định luật Newton", "Phương trình bậc 2")',
    example: 'Hàm số',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1, { message: 'Từ khóa không được để trống' })
  @MaxLength(200, { message: 'Từ khóa không được vượt quá 200 ký tự' })
  keyword!: string;

  @ApiPropertyOptional({
    enum: SearchType,
    enumName: 'SearchType',
    default: SearchType.All,
    description:
      'Loại tài liệu cần tìm: bài học (lessons), tài liệu đính kèm (materials), hoặc tất cả (all)',
    example: SearchType.All,
  })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;

  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
    example: 1,
    description: 'Trang hiện tại (bắt đầu từ 1)',
  })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 50,
    example: 10,
    description: 'Số kết quả mỗi trang (tối đa 50)',
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}
