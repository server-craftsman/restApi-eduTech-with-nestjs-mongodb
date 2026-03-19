import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
  ApiParam,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { WrongAnswerService } from './wrong-answer.service';
import {
  PracticeSubmitDto,
  PracticeResultDto,
  WrongAnswerWithQuestionDto,
  WrongAnswerStatsDto,
} from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';

@ApiTags('Wrong-Answer Bank (Review)')
@Controller('wrong-answers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(WrongAnswerWithQuestionDto, WrongAnswerStatsDto)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
export class WrongAnswerController extends BaseController {
  constructor(private readonly wrongAnswerService: WrongAnswerService) {
    super();
  }

  // ══════════════════════════════════════════════════════════
  // Student — Bank queries
  // ══════════════════════════════════════════════════════════

  /**
   * GET /wrong-answers/my-bank
   * Returns the student's full wrong-answer bank, enriched with Question details.
   * Filter by isMastered to split view: ?isMastered=false → only unresolved.
   */
  @Get('my-bank')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get my wrong-answer bank (all wrong questions with details)',
    description:
      'Returns every question the student has answered incorrectly, enriched with full question data. ' +
      'Use ?isMastered=false to see only items still needing practice.',
  })
  @ApiQuery({
    name: 'isMastered',
    required: false,
    type: Boolean,
    description:
      'Filter by mastery status. Omit for all, false = unresolved, true = mastered.',
    example: false,
  })
  @ApiResponse({ status: 200, type: [WrongAnswerWithQuestionDto] })
  async getMyBank(
    @CurrentUser() user: User,
    @Query('isMastered') isMastered: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    const filter = this.parseBooleanQuery(isMastered);
    const bank = await this.wrongAnswerService.getMyBank(user.id, filter);
    return this.sendSuccess(
      res,
      bank,
      'Wrong-answer bank retrieved successfully',
    );
  }

  /**
   * GET /wrong-answers/my-bank/stats
   * Summary numbers: total, mastered, remaining, masteryRate.
   */
  @Get('my-bank/stats')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({ summary: 'Get statistics for my wrong-answer bank' })
  @ApiResponse({ status: 200, type: WrongAnswerStatsDto })
  async getMyStats(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const stats = await this.wrongAnswerService.getStats(user.id);
    return this.sendSuccess(res, stats, 'Stats retrieved successfully');
  }

  /**
   * GET /wrong-answers/my-bank/lesson/:lessonId
   * Narrow the bank to questions from a single lesson.
   */
  @Get('my-bank/lesson/:lessonId')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get my wrong-answer bank filtered by lesson',
    description: 'Returns wrong questions from a specific lesson only.',
  })
  @ApiParam({ name: 'lessonId', example: '507f1f77bcf86cd799439014' })
  @ApiQuery({
    name: 'isMastered',
    required: false,
    type: Boolean,
    description: 'Omit for all, false = unresolved only, true = mastered only.',
  })
  @ApiResponse({ status: 200, type: [WrongAnswerWithQuestionDto] })
  async getBankByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
    @Query('isMastered') isMastered: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    const filter = this.parseBooleanQuery(isMastered);
    const bank = await this.wrongAnswerService.getBankByLesson(
      user.id,
      lessonId,
      filter,
    );
    return this.sendSuccess(
      res,
      bank,
      'Lesson wrong-answer bank retrieved successfully',
    );
  }

  // ══════════════════════════════════════════════════════════
  // Student — Practice session
  // ══════════════════════════════════════════════════════════

  /**
   * POST /wrong-answers/practice
   * Student submits (re-)answers for questions from their wrong-answer bank.
   * Server grades them, updates the bank (mastered / failCount++), returns results.
   */
  @Post('practice')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Submit practice answers for wrong-answer bank questions',
    description:
      'Grade a practice session. Correct answers mark the question as mastered. ' +
      'Wrong answers increment failCount. Returns per-question feedback.',
  })
  @ApiResponse({ status: 201, type: PracticeResultDto })
  @ApiResponse({
    status: 400,
    description: 'Bad request — empty answers array',
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async submitPractice(
    @Body() dto: PracticeSubmitDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.wrongAnswerService.submitPractice(user.id, dto);
    return this.sendSuccess(
      res,
      result,
      'Practice session graded successfully',
      HttpStatus.CREATED,
    );
  }

  // ══════════════════════════════════════════════════════════
  // Admin
  // ══════════════════════════════════════════════════════════

  /**
   * GET /wrong-answers/admin/user/:userId
   * Admin can view any student's wrong-answer bank.
   */
  @Get('admin/user/:userId')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: "View any student's wrong-answer bank (Admin only)",
  })
  @ApiParam({ name: 'userId', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({
    name: 'isMastered',
    required: false,
    type: Boolean,
    description: 'Omit for all, false = unresolved only, true = mastered only.',
  })
  @ApiResponse({ status: 200, type: [WrongAnswerWithQuestionDto] })
  async getUserBank(
    @Param('userId') userId: string,
    @Query('isMastered') isMastered: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    const filter = this.parseBooleanQuery(isMastered);
    const bank = await this.wrongAnswerService.getBankForUser(userId, filter);
    return this.sendSuccess(
      res,
      bank,
      'User wrong-answer bank retrieved successfully',
    );
  }

  /**
   * GET /wrong-answers/admin/user/:userId/stats
   * Admin statistics for a student.
   */
  @Get('admin/user/:userId/stats')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: "Get statistics for a student's wrong-answer bank (Admin only)",
  })
  @ApiParam({ name: 'userId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, type: WrongAnswerStatsDto })
  async getUserStats(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const stats = await this.wrongAnswerService.getStats(userId);
    return this.sendSuccess(res, stats, 'Stats retrieved successfully');
  }

  /**
   * DELETE /wrong-answers/admin/:id
   * Hard-soft-delete a specific wrong-answer record (Admin only).
   */
  // @Delete('admin/:id')
  // @Roles(UserRole.Admin)
  // @ApiOperation({ summary: 'Soft-delete a wrong-answer record (Admin only)' })
  // @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439001' })
  // @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  // async deleteRecord(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.wrongAnswerService.softDeleteRecord(id);
  //   return this.sendSuccess(res, null, 'Record deleted successfully');
  // }

  // ──────────────────────────────────────────────────────────
  // Private helper
  // ──────────────────────────────────────────────────────────

  /** Convert query-string 'true'/'false' to boolean or undefined. */
  private parseBooleanQuery(value: string | undefined): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }
}
