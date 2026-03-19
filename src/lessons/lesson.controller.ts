import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { LessonService } from './lesson.service';
import { CreateLessonDto, UpdateLessonDto, LessonDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';

@ApiTags('Lessons')
@Controller('lessons')
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions',
})
export class LessonController extends BaseController {
  constructor(private readonly lessonService: LessonService) {
    super();
  }

  /**
   * Create a new lesson
   * Only TEACHER and ADMIN can create lessons
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new lesson (TEACHER/ADMIN only)',
    description:
      'Create a new lesson within a chapter. Only teachers and administrators can create lessons.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson created successfully',
    type: LessonDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid lesson data',
  })
  async createLesson(
    @Body() dto: CreateLessonDto,
    @Res() res: Response,
  ): Promise<Response> {
    const lesson = await this.lessonService.createLesson(dto);
    return this.sendSuccess(
      res,
      lesson,
      'Lesson created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all lessons in a chapter (ordered)
   * Public endpoint
   */
  @Get('chapter/:chapterId')
  @ApiOperation({
    summary: 'Get all lessons in a chapter (ordered)',
    description:
      'Retrieve all lessons in a specific chapter, ordered by lesson index',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'Chapter ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lessons retrieved successfully',
    type: [LessonDto],
  })
  async getByChapterId(
    @Param('chapterId') chapterId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const lessons = await this.lessonService.findByChapterIdOrdered(chapterId);
    return this.sendSuccess(res, lessons, 'Lessons retrieved successfully');
  }

  /**
   * Get lesson by ID
   * Public endpoint
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get lesson by ID',
    description: 'Retrieve a specific lesson by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson retrieved successfully',
    type: LessonDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getLessonById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const lesson = await this.lessonService.getLessonById(id);
    if (!lesson) {
      return this.sendError(
        res,
        'Lesson not found',
        'The requested lesson does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, lesson, 'Lesson retrieved successfully');
  }

  /**
   * Get all lessons
   * Public endpoint
   */
  @Get()
  @ApiOperation({
    summary: 'Get all lessons',
    description: 'Retrieve all lessons in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Lessons retrieved successfully',
    type: [LessonDto],
  })
  async getAllLessons(@Res() res: Response): Promise<Response> {
    const lessons = await this.lessonService.getAllLessons();
    return this.sendSuccess(res, lessons, 'Lessons retrieved successfully');
  }

  /**
   * Update a lesson
   * Only TEACHER and ADMIN can update lessons
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a lesson (TEACHER/ADMIN only)',
    description:
      'Update an existing lesson. Only teachers and administrators can update lessons.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated successfully',
    type: LessonDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid update data',
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Res() res: Response,
  ): Promise<Response> {
    const lesson = await this.lessonService.updateLesson(id, dto);
    return this.sendSuccess(res, lesson, 'Lesson updated successfully');
  }

  /**
   * Get next lesson in sequence
   * Public endpoint
   */
  @Get(':id/next')
  @ApiOperation({
    summary: 'Get next lesson in chapter sequence',
    description:
      'Retrieve the next lesson after the current one in chapter order',
  })
  @ApiParam({
    name: 'id',
    description: 'Current lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Next lesson retrieved',
    type: LessonDto,
  })
  @ApiResponse({ status: 404, description: 'No next lesson available' })
  async getNextLesson(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const nextLesson = await this.lessonService.findNextLesson(id);
    if (!nextLesson) {
      return this.sendError(
        res,
        'No next lesson',
        'This is the last lesson in the chapter',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      nextLesson,
      'Next lesson retrieved successfully',
    );
  }

  /**
   * Delete a lesson
   * Only ADMIN can delete lessons
   */
  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.Admin)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Delete a lesson (ADMIN only)',
  //   description:
  //     'Soft-delete a lesson. Only administrators can delete lessons.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'Lesson ID',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Lesson deleted successfully',
  // })
  // @ApiResponse({ status: 404, description: 'Lesson not found' })
  // async deleteLesson(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.lessonService.deleteLesson(id);
  //   return this.sendSuccess(res, null, 'Lesson deleted successfully');
  // }
}
