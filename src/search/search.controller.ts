import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CurrentUser } from '../auth/decorators';
import {
  LessonSearchResultDto,
  MaterialSearchResultDto,
  CourseSearchResultDto,
  ChapterSearchResultDto,
  SubjectSearchResultDto,
  ExamSearchResultDto,
  SearchMixedItemDto,
  SearchGroupResultDto,
  SearchMetaDto,
  SearchResultDto,
} from './dto/search-result.dto';
import { User } from '../users/domain/user';

@ApiTags('Smart Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(
  LessonSearchResultDto,
  MaterialSearchResultDto,
  CourseSearchResultDto,
  ChapterSearchResultDto,
  SubjectSearchResultDto,
  ExamSearchResultDto,
  SearchMixedItemDto,
  SearchGroupResultDto,
  SearchMetaDto,
)
export class SearchController extends BaseController {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  /**
   * GET /search?keyword=quadratic&type=all&page=1&limit=10
   * Smart Search Flow: multi-entity search with Vietnamese accent-insensitive matching
   */
  @Get()
  @ApiOperation({
    summary:
      'Smart search across lessons, materials, courses, chapters, subjects, exams',
    description: `
## Smart Search Flow

Student types a keyword → system runs Vietnamese accent-insensitive search → returns ranked and grouped results.

### Usage:
1. Enter a keyword in \`keyword\` (e.g. \`"quadratic function"\`, \`"Newton's law"\`)
2. Filter by single \`type\` or multi \`types\` (comma-separated)
3. Choose \`sortBy\`: \`relevance\`, \`newest\`, \`oldest\`, \`alphabetical\`
4. Use \`page\` and \`limit\` for merged pagination

### Search scope:
- **Lessons**: title, description, theory content
- **Materials**: title/type/description
- **Courses**: title, description
- **Chapters**: title, description
- **Subjects**: name, slug
- **Exams**: title, description

### Examples:
- \`GET /search?keyword=toan hoc&type=all&page=1&limit=10\`
- \`GET /search?keyword=nguyen ham&types=lessons,courses,materials&sortBy=relevance\`
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SearchResultDto,
    description: 'List of lessons and materials matching the keyword',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid keyword',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized — JWT token missing or invalid',
  })
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.searchService.search(query, user.role);
    const message =
      result.total > 0
        ? `Found ${result.total} result(s) for "${query.keyword}"`
        : `No results found for "${query.keyword}"`;
    return this.sendSuccess(res, result, message);
  }
}
