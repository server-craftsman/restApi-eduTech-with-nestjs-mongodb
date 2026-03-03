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

@ApiTags('🔍 Smart Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(LessonSearchResultDto, MaterialSearchResultDto)
export class SearchController extends BaseController {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  /**
   * GET /search?keyword=Hàm số&type=all&page=1&limit=10
   * Smart Search Flow - Bước 2: Tìm kiếm bài học & tài liệu theo từ khóa
   */
  @Get()
  @ApiOperation({
    summary: '🔍 Tìm kiếm bài học và tài liệu theo từ khóa',
    description: `
## Smart Search Flow

Học sinh gặp khó khăn → Nhập từ khóa → Hệ thống lọc trong Database → Trả về danh sách bài học/tài liệu liên quan.

### Cách sử dụng:
1. Nhập từ khóa vào \`keyword\` (ví dụ: "Hàm số", "Định luật Newton")
2. Chọn \`type\` để lọc: \`lessons\` (bài học), \`materials\` (tài liệu), \`all\` (tất cả)
3. Sử dụng \`page\` và \`limit\` để phân trang

### Tìm kiếm trên:
- **Bài học** (lessons): Tiêu đề, mô tả, nội dung lý thuyết (Markdown)
- **Tài liệu** (materials): Tiêu đề tài liệu đính kèm (PDF, DOCX, PPTX...)

### Ví dụ:
- \`GET /search?keyword=Hàm số&type=lessons\`
- \`GET /search?keyword=Newton&type=all&page=1&limit=10\`
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SearchResultDto,
    description: 'Danh sách bài học và tài liệu phù hợp với từ khóa',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Từ khóa không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập',
  })
  async search(
    @Query() query: SearchQueryDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.searchService.search(query);
    const message =
      result.total > 0
        ? `Tìm thấy ${result.total} kết quả cho "${query.keyword}"`
        : `Không tìm thấy kết quả nào cho "${query.keyword}"`;
    return this.sendSuccess(res, result, message);
  }
}
