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
      'Search keyword (e.g. "quadratic function", "Newton\'s law", "quadratic equation")',
    example: 'quadratic function',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1, { message: 'Keyword must not be empty' })
  @MaxLength(200, { message: 'Keyword must not exceed 200 characters' })
  keyword!: string;

  @ApiPropertyOptional({
    enum: SearchType,
    enumName: 'SearchType',
    default: SearchType.All,
    description:
      'Content type to search: lessons, attached materials, or all',
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
    description: 'Current page number (starts at 1)',
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
    description: 'Number of results per page (max 50)',
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}
