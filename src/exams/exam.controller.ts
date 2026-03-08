import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { UserRole } from '../enums';
import { ExamService } from './exam.service';
import {
  CreateExamDto,
  UpdateExamDto,
  SubmitExamDto,
  QueryExamDto,
  FilterExamDto,
  SortExamDto,
  ExamDto,
  StartExamResponseDto,
  ExamResultDto,
  ExamAttemptSummaryDto,
} from './dto';

@ApiTags('Exams')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FilterExamDto, SortExamDto, ExamAttemptSummaryDto)
export class ExamController extends BaseController {
  constructor(private readonly examService: ExamService) {
    super();
  }

  // ─────────────────────────────────────────────────────────────
  // Admin / Teacher — Exam management
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /exams
   * Create a new exam (Teacher / Admin only).
   */
  @Post()
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Create a new exam (Teacher / Admin)' })
  @ApiResponse({ status: 201, type: ExamDto })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid question IDs',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createExam(
    @Body() dto: CreateExamDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const exam = await this.examService.createExam(dto, user.id);
    return this.sendSuccess(
      res,
      exam,
      'Exam created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * GET /exams
   * List exams — paginated, filterable, sortable.
   * Teachers/Admin see all; Students see only published exams.
   */
  @Get()
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'List exams — paginated, filterable, sortable',
    description:
      'Students only see published exams. Teachers / Admins can filter by `isPublished`.',
  })
  @ApiResponse({ status: 200, type: ExamDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listExams(
    @Query() query: QueryExamDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    // Students can only browse published exams
    if (user.role === UserRole.Student) {
      if (!query.filters) query.filters = {};
      query.filters.isPublished = true;
    }

    const result = await this.examService.listExams(query);
    return this.sendPaginated(
      res,
      result.items,
      result.total,
      result.page,
      result.limit,
    );
  }

  /**
   * GET /exams/:id
   * Get exam metadata by ID.
   */
  @Get(':id')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Get exam metadata by ID' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, type: ExamDto })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getExamById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const exam = await this.examService.getExamById(id);
    return this.sendSuccess(res, exam, 'Exam retrieved successfully');
  }

  /**
   * PUT /exams/:id
   * Update an exam (Teacher / Admin only).
   */
  @Put(':id')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Update an exam (Teacher / Admin)' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, type: ExamDto })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateExam(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @Res() res: Response,
  ): Promise<Response> {
    const exam = await this.examService.updateExam(id, dto);
    return this.sendSuccess(res, exam, 'Exam updated successfully');
  }

  /**
   * DELETE /exams/:id
   * Soft-delete an exam (Admin only).
   */
  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Soft-delete an exam (Admin only)' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteExam(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.examService.deleteExam(id);
    return this.sendSuccess(res, null, 'Exam deleted successfully');
  }

  // ─────────────────────────────────────────────────────────────
  // Student — Exam Flow
  // ─────────────────────────────────────────────────────────────

  /**
   * GET /exams/:id/start
   * Step 1 of Exam Flow — Student starts the exam.
   * Returns exam metadata + sanitised questions (NO correctAnswer / explanation).
   * Frontend starts the countdown timer using `timeLimitSeconds`.
   */
  @Get(':id/start')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Start an exam — get questions without answers (Step 1)',
    description:
      'Returns exam metadata and sanitised question list. ' +
      'Use `timeLimitSeconds` to start the frontend countdown timer.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, type: StartExamResponseDto })
  @ApiResponse({ status: 403, description: 'Exam not published' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startExam(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.examService.startExam(id);
    return this.sendSuccess(res, data, 'Exam started — good luck!');
  }

  /**
   * POST /exams/:id/submit
   * Step 2 of Exam Flow — Student submits answers.
   * Returns instant score and full per-question result.
   */
  @Post(':id/submit')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Submit exam answers — instant grading (Step 2)',
    description:
      'Submit all answers and total time. ' +
      'The response includes score, passed status, ' +
      'and per-question breakdown with correct answers and explanations.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 201, type: ExamResultDto })
  @ApiResponse({ status: 400, description: 'No answers submitted' })
  @ApiResponse({ status: 403, description: 'Exam not published' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitExam(
    @Param('id') id: string,
    @Body() dto: SubmitExamDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.examService.submitExam(id, dto, user.id);
    return this.sendSuccess(
      res,
      result,
      'Exam submitted and graded',
      HttpStatus.CREATED,
    );
  }

  /**
   * GET /exams/:id/my-attempts
   * Step 3 (history) — Student lists their own attempts for an exam.
   */
  @Get(':id/my-attempts')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: "List the current student's attempts for an exam",
    description:
      'Returns a list of attempt summaries ordered by most recent first.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, type: ExamAttemptSummaryDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyAttempts(
    @Param('id') examId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const attempts = await this.examService.getMyAttemptsForExam(
      user.id,
      examId,
    );
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }

  /**
   * GET /exams/attempts/:attemptId/result
   * Step 3 (detail) — Get full result for a specific attempt.
   * Student can only view their own; Teacher / Admin can view any.
   */
  @Get('attempts/:attemptId/result')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get full result for a specific attempt (Step 3)',
    description:
      'Returns score, passed, and per-question breakdown with correct answers + explanations. ' +
      'Students can only access their own attempts.',
  })
  @ApiParam({ name: 'attemptId', description: 'Exam Attempt ID' })
  @ApiResponse({ status: 200, type: ExamResultDto })
  @ApiResponse({ status: 403, description: 'Forbidden — not your attempt' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAttemptResult(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    // Students are restricted to own attempts; admins/teachers see all
    const ownerFilter = user.role === UserRole.Student ? user.id : undefined;
    const result = await this.examService.getAttemptResult(
      attemptId,
      ownerFilter,
    );
    return this.sendSuccess(res, result, 'Result retrieved successfully');
  }

  /**
   * GET /exams/:id/attempts
   * Admin / Teacher — view all student attempts for an exam.
   */
  @Get(':id/attempts')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'List all attempts for an exam (Teacher / Admin)',
    description:
      'Returns attempt summaries for every student who submitted this exam.',
  })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, type: ExamAttemptSummaryDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getExamAttempts(
    @Param('id') examId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const attempts = await this.examService.getExamAttempts(examId);
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }
}
