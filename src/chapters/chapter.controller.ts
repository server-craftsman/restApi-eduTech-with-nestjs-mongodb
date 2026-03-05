import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { ChapterService } from './chapter.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  UpdateChapterPublishStatusDto,
} from './dto';
import {
  QueryChapterDto,
  FilterChapterDto,
  SortChapterDto,
} from './dto/query-chapter.dto';
import { ChapterDto } from './dto/chapter.dto';
import { ChapterStatisticsDto } from './dto/chapter-statistics.dto';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';

@ApiTags('Chapters')
@Controller('chapters')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FilterChapterDto, SortChapterDto, ChapterStatisticsDto)
export class ChapterController extends BaseController {
  constructor(private readonly chapterService: ChapterService) {
    super();
  }

  /**
   * Create a new chapter — TEACHER/ADMIN only
   */
  @Post()
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Create a new chapter (Teacher/Admin only)' })
  @ApiResponse({ status: 201, type: ChapterDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  async create(
    @Body() dto: CreateChapterDto,
    @Res() res: Response,
  ): Promise<Response> {
    const chapter = await this.chapterService.create(dto);
    return this.sendSuccess(
      res,
      chapter,
      'Chapter created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all chapters with filtering and pagination — all authenticated users
   */
  @Get()
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary:
      'List chapters — paginated, filterable, sortable (all roles, STUDENT sees published only)',
  })
  @ApiResponse({ status: 200, type: InfinityPaginationResponse(ChapterDto) })
  async findAll(
    @Query() query: QueryChapterDto,
    @Res() res: Response,
  ): Promise<Response> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const data = await this.chapterService.findAll(
      page,
      limit,
      query.filters,
      query.sort,
    );
    return this.sendSuccess(res, data, 'Chapters retrieved successfully');
  }

  /**
   * Get admin chapter statistics — ADMIN only
   */
  @Get('admin/stats')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get chapter statistics (Admin only)' })
  @ApiResponse({ status: 200, type: ChapterStatisticsDto })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  async getStatistics(@Res() res: Response): Promise<Response> {
    const stats = await this.chapterService.getStatistics();
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  /**
   * Get chapter by ID — all authenticated users
   */
  @Get(':id')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Get chapter by ID (all authenticated users)' })
  @ApiResponse({ status: 200, type: ChapterDto })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async findById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const chapter = await this.chapterService.findById(id);
    if (!chapter) {
      return this.sendError(
        res,
        'Chapter not found',
        'Chapter not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, chapter, 'Chapter retrieved successfully');
  }

  /**
   * Get chapters by course ID — all authenticated users
   */
  @Get('course/:courseId')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get all chapters in a course (all authenticated users)',
  })
  @ApiResponse({ status: 200, type: [ChapterDto] })
  async getByCourseId(
    @Param('courseId') courseId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const chapters = await this.chapterService.findByCourseId(courseId);
    return this.sendSuccess(res, chapters, 'Chapters retrieved successfully');
  }

  /**
   * Update chapter by ID — TEACHER/ADMIN only
   */
  @Put(':id')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Update chapter by ID (Teacher/Admin only)' })
  @ApiResponse({ status: 200, type: ChapterDto })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
    @Res() res: Response,
  ): Promise<Response> {
    const chapter = await this.chapterService.update(id, dto);
    return this.sendSuccess(res, chapter, 'Chapter updated successfully');
  }

  /**
   * Update chapter publish status — TEACHER/ADMIN only
   */
  @Patch(':id/publish-status')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Update chapter publish status explicitly (Teacher/Admin only)',
  })
  @ApiResponse({ status: 200, type: ChapterDto })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updatePublishStatus(
    @Param('id') id: string,
    @Body() dto: UpdateChapterPublishStatusDto,
    @Res() res: Response,
  ): Promise<Response> {
    const chapter = await this.chapterService.updatePublishStatus(
      id,
      dto.isPublished,
    );
    return this.sendSuccess(
      res,
      chapter,
      `Chapter ${dto.isPublished ? 'published' : 'unpublished'} successfully`,
    );
  }

  /**
   * Reorder chapters within a course — TEACHER/ADMIN only
   */
  @Put('course/:courseId/reorder')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary:
      'Reorder chapters in a course — update orderIndex (Teacher/Admin only)',
  })
  @ApiResponse({ status: 200, type: [ChapterDto] })
  @ApiResponse({ status: 400, description: 'Invalid chapter order data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorderChapters(
    @Param('courseId') courseId: string,
    @Body() data: { chapters: Array<{ id: string; orderIndex: number }> },
    @Res() res: Response,
  ): Promise<Response> {
    const chapters = await this.chapterService.reorderChapters(
      courseId,
      data.chapters,
    );
    return this.sendSuccess(res, chapters, 'Chapters reordered successfully');
  }

  /**
   * Soft-delete chapter by ID — ADMIN only
   */
  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Soft-delete chapter by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Chapter soft-deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.chapterService.delete(id);
    return this.sendSuccess(res, null, 'Chapter deleted successfully');
  }
}
