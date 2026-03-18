import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
  Courses = 'courses',
  Chapters = 'chapters',
  Subjects = 'subjects',
  Exams = 'exams',
}

export enum SearchSortBy {
  Relevance = 'relevance',
  Newest = 'newest',
  Oldest = 'oldest',
  Alphabetical = 'alphabetical',
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
      'Single content type filter (backward-compatible). Prefer `types[]` for multi-target search.',
    example: SearchType.All,
  })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;

  @ApiPropertyOptional({
    type: [String],
    enum: SearchType,
    enumName: 'SearchType',
    description:
      'Multi-target search. Accepts repeated query params or comma-separated values. Example: `types=lessons,materials,courses`',
    example: [SearchType.Lessons, SearchType.Materials, SearchType.Courses],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }
    return String(value)
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  })
  @IsArray()
  @IsEnum(SearchType, { each: true })
  types?: SearchType[];

  @ApiPropertyOptional({
    enum: SearchSortBy,
    enumName: 'SearchSortBy',
    default: SearchSortBy.Relevance,
    description: 'Sorting strategy for merged search results',
    example: SearchSortBy.Relevance,
  })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description:
      'Include unpublished/draft records for content types that support publish state',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === true || value === 'true'
      ? true
      : value === false || value === 'false'
        ? false
        : false,
  )
  includeDraft?: boolean;

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
