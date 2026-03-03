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
import {
  LessonSearchResultDto,
  MaterialSearchResultDto,
  SearchResultDto,
} from './dto/search-result.dto';

@ApiTags('Smart Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(LessonSearchResultDto, MaterialSearchResultDto)
export class SearchController extends BaseController {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  /**
   * GET /search?keyword=quadratic&type=all&page=1&limit=10
   * Smart Search Flow — Step 2: Search lessons & materials by keyword
   */
  @Get()
  @ApiOperation({
    summary: 'Search lessons and materials by keyword',
    description: `
## Smart Search Flow

Student encounters difficulty → Types a keyword → System filters the database → Returns a list of relevant lessons and materials.

### Usage:
1. Enter a keyword in \`keyword\` (e.g. \`"quadratic function"\`, \`"Newton's law"\`)
2. Filter by \`type\`: \`lessons\`, \`materials\`, or \`all\`
3. Use \`page\` and \`limit\` for pagination

### Search scope:
- **Lessons**: title, description, and theory content (Markdown)
- **Materials**: title of attached files (PDF, DOCX, PPTX…)

### Examples:
- \`GET /search?keyword=quadratic&type=lessons\`
- \`GET /search?keyword=Newton&type=all&page=1&limit=10\`
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
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.searchService.search(query);
    const message =
      result.total > 0
        ? `Found ${result.total} result(s) for "${query.keyword}"`
        : `No results found for "${query.keyword}"`;
    return this.sendSuccess(res, result, message);
  }
}
