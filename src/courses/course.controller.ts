import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CourseService } from './course.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  QueryCourseDto,
  FilterCourseDto,
  SortCourseDto,
  UpdateCourseStatusDto,
  ReviewCourseDto,
} from './dto';
import { CourseStatus, UserRole } from '../enums';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, Roles } from '../auth/decorators';
import { User } from '../users/domain/user';

@ApiTags('Courses')
@Controller('courses')
@ApiExtraModels(FilterCourseDto, SortCourseDto)
export class CourseController extends BaseController {
  constructor(private readonly courseService: CourseService) {
    super();
  }

  // ─────────────────────────────────────────────────────────────
  // GET endpoints
  // ─────────────────────────────────────────────────────────────

  // ─── Personalized ─────────────────────────────────────────────────────────

  /**
   * GET /courses/personalized
   *
   * Returns published courses filtered to the authenticated student's grade
   * level (and optionally boosted by their preferred subjects).
   *
   * Students who haven't completed onboarding yet receive a 200 with a
   * `needsOnboarding` hint instead of an empty list.
   *
   * Non-Student roles (Teacher, Admin) receive all published courses with no
   * grade-level restriction.
   */
  @Get('personalized')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get grade-filtered published courses for the logged-in student',
    description:
      'Reads the student profile to extract gradeLevel and preferredSubjectIds, ' +
      "then returns only published courses that match the student's grade. " +
      'Teachers and Admins see all published courses.',
  })
  @ApiResponse({ status: 200, description: 'Personalised courses retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPersonalizedCourses(
    @CurrentUser() user: User,
    @Query() query: QueryCourseDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const result = await this.courseService.getPersonalizedCourses(
        user.role,
        user.id,
        query,
      );

      if (result.needsOnboarding) {
        return this.sendSuccess(
          res,
          {
            needsOnboarding: true,
            onboardingUrl:
              result.onboardingUrl ?? '/student-profiles/onboarding',
            strategy: result.strategy,
            courses: result.courses,
            total: result.total,
          },
          'Complete onboarding to receive personalised content',
        );
      }

      return this.sendPaginated(
        res,
        result.courses,
        result.total,
        query.page ?? 1,
        query.limit ?? 10,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.sendError(
        res,
        message,
        'Failed to retrieve personalised courses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get published courses — paginated, filterable, sortable (public)',
    description:
      'Always restricted to Published courses. ' +
      'Pass `filters` as JSON string: `{"subjectId":"xxx","type":"Free","search":"Math"}`. ' +
      'Pass `sort` as JSON array: `[{"orderBy":"createdAt","order":"desc"}]`.',
  })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async getAllCourses(
    @Query() query: QueryCourseDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      // Always lock status to Published — cannot be overridden by caller
      const result = await this.courseService.findAllWithFilters(query, {
        status: CourseStatus.Published,
      });
      return this.sendPaginated(
        res,
        result.courses,
        result.total,
        query.page ?? 1,
        query.limit ?? 10,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.sendError(
        res,
        message,
        'Failed to retrieve courses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all courses — all statuses + soft-deleted (Admin only)',
    description:
      'Admin can browse courses in any status. ' +
      'Use `filters={"status":"Under_Review"}` to see courses awaiting review. ' +
      'Use `filters={"isDeleted":true}` for audit of soft-deleted records.',
  })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAllCoursesAdmin(
    @Query() query: QueryCourseDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const result = await this.courseService.findAllWithFilters(query);
      return this.sendPaginated(
        res,
        result.courses,
        result.total,
        query.page ?? 1,
        query.limit ?? 10,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.sendError(
        res,
        message,
        'Failed to retrieve courses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get courses created by the authenticated teacher',
    description:
      "Returns the caller's own courses in any status. " +
      'Supports the same `filters` (except authorId — fixed to caller) and `sort` parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'My courses retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyCourses(
    @CurrentUser() user: User,
    @Query() query: QueryCourseDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      // authorId from JWT always wins — cannot be overridden by query.filters
      const result = await this.courseService.findAllWithFilters(query, {
        authorId: user.id,
      });
      return this.sendPaginated(
        res,
        result.courses,
        result.total,
        query.page ?? 1,
        query.limit ?? 10,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.sendError(
        res,
        message,
        'Failed to retrieve my courses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        return this.sendError(
          res,
          {},
          'Course not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return this.sendSuccess(res, course, 'Course retrieved successfully');
    } catch (error) {
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to retrieve course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (Admin/Teacher only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      // Automatically assign authorId from JWT token
      const courseData = {
        ...createCourseDto,
        authorId: user.id,
        status: CourseStatus.Draft,
        isDeleted: false,
      };

      const course = await this.courseService.createCourse(courseData);
      return this.sendSuccess(
        res,
        course,
        'Course created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to create course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      // Check if user owns the course or has admin rights
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        return this.sendError(
          res,
          {},
          'Course not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (course.authorId !== user.id) {
        return this.sendError(
          res,
          {},
          'You do not have permission to update this course',
          HttpStatus.FORBIDDEN,
        );
      }

      const updatedCourse = await this.courseService.updateCourse(
        id,
        updateCourseDto,
      );
      return this.sendSuccess(
        res,
        updatedCourse,
        'Course updated successfully',
      );
    } catch (error) {
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to update course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course status directly (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Course status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  async updateCourseStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCourseStatusDto,
    @Res() res: Response,
  ) {
    try {
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        return this.sendError(
          res,
          {},
          'Course not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedCourse = await this.courseService.updateCourseStatus(
        id,
        updateStatusDto.status,
      );
      return this.sendSuccess(
        res,
        updatedCourse,
        'Course status updated successfully',
      );
    } catch (error) {
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to update course status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete course (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      // Check if user owns the course or has admin rights
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        return this.sendError(
          res,
          {},
          'Course not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (course.authorId !== user.id) {
        return this.sendError(
          res,
          {},
          'You do not have permission to delete this course',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.courseService.softDeleteCourse(id);
      return this.sendSuccess(res, null, 'Course deleted successfully');
    } catch (error) {
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to delete course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore soft deleted course (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Course restored successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async restoreCourse(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      // Check if user owns the course or has admin rights
      const course = await this.courseService.getCourseByIdWithDeleted(id);
      if (!course) {
        return this.sendError(
          res,
          {},
          'Course not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (course.authorId !== user.id) {
        return this.sendError(
          res,
          {},
          'You do not have permission to restore this course',
          HttpStatus.FORBIDDEN,
        );
      }

      const restoredCourse = await this.courseService.restoreCourse(id);
      return this.sendSuccess(
        res,
        restoredCourse,
        'Course restored successfully',
      );
    } catch (error) {
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to restore course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Approval workflow endpoints
  // ─────────────────────────────────────────────────────────────

  @Patch(':id/submit-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit course for Admin review (Teacher only)',
    description:
      'Teacher submits their own Draft or Rejected course for Admin approval. Status changes to Under_Review.',
  })
  @ApiResponse({ status: 200, description: 'Course submitted for review' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the course owner' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async submitForReview(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      const course = await this.courseService.submitForReview(id, user.id);
      return this.sendSuccess(
        res,
        course,
        'Course submitted for review successfully',
      );
    } catch (error: unknown) {
      const status = this.getHttpStatusFromError(error);
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to submit course for review',
        status,
      );
    }
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve a course (Admin only)',
    description:
      'Admin approves a course that is Under Review. Status changes to Published and the course becomes visible to all users.',
  })
  @ApiResponse({ status: 200, description: 'Course approved and published' })
  @ApiResponse({ status: 400, description: 'Course is not Under Review' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async approveCourse(
    @Param('id') id: string,
    @Body() dto: ReviewCourseDto,
    @Res() res: Response,
  ) {
    try {
      const course = await this.courseService.approveCourse(id, dto.note);
      return this.sendSuccess(
        res,
        course,
        'Course approved and published successfully',
      );
    } catch (error: unknown) {
      const status = this.getHttpStatusFromError(error);
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to approve course',
        status,
      );
    }
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject a course (Admin only)',
    description:
      'Admin rejects a course that is Under Review with a mandatory reason. Status changes to Rejected. Teacher can edit and resubmit.',
  })
  @ApiResponse({ status: 200, description: 'Course rejected with reason' })
  @ApiResponse({
    status: 400,
    description: 'Course is not Under Review or missing note',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async rejectCourse(
    @Param('id') id: string,
    @Body() dto: ReviewCourseDto,
    @Res() res: Response,
  ) {
    try {
      const course = await this.courseService.rejectCourse(id, dto.note ?? '');
      return this.sendSuccess(res, course, 'Course rejected successfully');
    } catch (error: unknown) {
      const status = this.getHttpStatusFromError(error);
      return this.sendError(
        res,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to reject course',
        status,
      );
    }
  }

  private getHttpStatusFromError(error: unknown): HttpStatus {
    if (error instanceof HttpException) {
      return error.getStatus() as HttpStatus;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
