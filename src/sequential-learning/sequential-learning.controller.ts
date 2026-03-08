import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { BaseController } from '../core/base/base.controller';
import { SequentialLearningService } from './sequential-learning.service';
import {
  VideoProgressRequestDto,
  QuizSubmitDto,
  QuizResultDto,
  LessonStatusDto,
  CurriculumDto,
  QuestionForStudentDto,
} from './dto';

@ApiTags('Sequential Learning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sequential-learning')
@ApiExtraModels(
  QuizResultDto,
  LessonStatusDto,
  CurriculumDto,
  QuestionForStudentDto,
)
export class SequentialLearningController extends BaseController {
  constructor(
    private readonly sequentialLearningService: SequentialLearningService,
  ) {
    super();
  }

  // =========================================================================
  // STEP 1 — Chapter / lesson tree with lock status
  // =========================================================================

  @Get('curriculum/:courseId')
  @ApiOperation({
    summary:
      'Get course curriculum tree with per-lesson lock / progress status',
    description:
      'Returns the full chapter → lesson hierarchy for the given course, ' +
      "annotated with the authenticated student's progress (isLocked, videoWatched, quizCompleted).",
  })
  @ApiParam({ name: 'courseId', description: 'MongoDB ObjectId of the course' })
  @ApiResponse({ status: 200, type: CurriculumDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurriculum(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const curriculum = await this.sequentialLearningService.getCurriculum(
      user.id,
      courseId,
    );
    return this.sendSuccess(
      res,
      curriculum,
      'Curriculum retrieved successfully',
    );
  }

  // =========================================================================
  // STEP 2a — Video progress heartbeat
  // =========================================================================

  @Post('video/:lessonId/progress')
  @ApiOperation({
    summary: 'Send video watch progress (heartbeat every ~10 s)',
    description:
      "Updates the student's current watch position. " +
      'Automatically marks videoWatched = true once >= 90 % of the video has been seen.',
  })
  @ApiParam({ name: 'lessonId', description: 'MongoDB ObjectId of the lesson' })
  @ApiResponse({ status: 200, description: 'Progress saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('lessons/:lessonId/video-progress')
  async trackVideoProgress(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Body() dto: VideoProgressRequestDto,
    @Res() res: Response,
  ): Promise<Response> {
    await this.sequentialLearningService.trackVideoProgress(user.id, {
      ...dto,
      lessonId,
    });
    return this.sendSuccess(res, { success: true }, 'Video progress saved');
  }

  /**
   * Legacy endpoint (kept for backward compatibility with existing clients).
   * Expects lessonId in request body.
   */
  @Post('track-video')
  @ApiOperation({
    summary: '[Legacy] Track video watching progress',
    description:
      'Backward-compatible endpoint. Prefer POST /sequential-learning/video/:lessonId/progress.',
  })
  @ApiResponse({ status: 200, description: 'Progress saved' })
  @ApiResponse({
    status: 400,
    description: 'lessonId is required in request body',
  })
  async trackVideoProgressLegacy(
    @CurrentUser() user: User,
    @Body() dto: VideoProgressRequestDto,
    @Res() res: Response,
  ): Promise<Response> {
    if (!dto.lessonId) {
      return this.sendError(
        res,
        'lessonId is required in request body',
        'Missing lessonId',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.sequentialLearningService.trackVideoProgress(user.id, dto);
    return this.sendSuccess(res, { success: true }, 'Video progress saved');
  }

  // =========================================================================
  // STEP 2b — Explicit "video finished" signal
  // =========================================================================

  @Post('video/:lessonId/complete')
  @ApiOperation({
    summary: 'Mark video as fully watched (fires when player ends)',
    description:
      'Explicitly marks the video complete regardless of current time. ' +
      'Returns updated lesson status so the UI can immediately enable the quiz button.',
  })
  @ApiParam({ name: 'lessonId', description: 'MongoDB ObjectId of the lesson' })
  @ApiResponse({ status: 200, type: LessonStatusDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @Post('lessons/:lessonId/video-complete')
  @Post('lesson/:lessonId/complete')
  async completeVideo(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const status = await this.sequentialLearningService.completeVideo(
      user.id,
      lessonId,
    );
    return this.sendSuccess(res, status, 'Video marked as completed');
  }

  // =========================================================================
  // STEP 3a — Get quiz questions (no correct answers)
  // =========================================================================

  @Get('lesson/:lessonId/questions')
  @ApiOperation({
    summary:
      'Fetch quiz questions for a lesson (student-safe, no correct answers)',
    description:
      'Returns the quiz questions for a lesson. ' +
      'correctAnswer is intentionally omitted — grading is always done server-side. ' +
      'Requires the student to have finished watching the video first.',
  })
  @ApiParam({ name: 'lessonId', description: 'MongoDB ObjectId of the lesson' })
  @ApiResponse({ status: 200, type: [QuestionForStudentDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Video not yet watched' })
  @ApiResponse({
    status: 404,
    description: 'No questions found for this lesson',
  })
  async getQuizQuestions(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const questions = await this.sequentialLearningService.getQuizQuestions(
      user.id,
      lessonId,
    );
    return this.sendSuccess(
      res,
      questions,
      'Quiz questions retrieved successfully',
    );
  }

  // =========================================================================
  // STEP 3b — Submit quiz answers
  // =========================================================================

  @Post('lesson/:lessonId/submit-quiz')
  @ApiOperation({
    summary: 'Submit quiz answers and receive graded result',
    description:
      "Submits the student's answers for server-side grading. " +
      'If score >= 80%, lesson is marked complete and nextLessonId is returned to unlock the next lesson.',
  })
  @ApiParam({ name: 'lessonId', description: 'MongoDB ObjectId of the lesson' })
  @ApiResponse({ status: 200, type: QuizResultDto })
  @ApiResponse({ status: 400, description: 'Lesson has no quiz questions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Video not yet watched' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async submitQuiz(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Body() dto: QuizSubmitDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.sequentialLearningService.submitQuizForLesson(
      user.id,
      lessonId,
      dto,
    );
    const message = result.passed
      ? `Quiz passed! Score: ${result.score}%${result.nextLessonId ? ' — next lesson unlocked' : ''}`
      : `Quiz completed. Score: ${result.score}%. Need >= 80% to pass.`;
    return this.sendSuccess(res, result, message);
  }

  // =========================================================================
  // Lesson status & quiz access
  // =========================================================================

  @Get('lesson/:lessonId/status')
  @ApiOperation({
    summary: 'Get full lesson status (lock state, progress, quiz result)',
    description:
      'Returns all the progress flags that the UI needs: isLocked, videoWatched, ' +
      'canAccessQuiz, quizCompleted, quizScore, isCompleted.',
  })
  @ApiParam({ name: 'lessonId', description: 'MongoDB ObjectId of the lesson' })
  @ApiResponse({ status: 200, type: LessonStatusDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLessonStatus(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const status = await this.sequentialLearningService.getLessonStatus(
      user.id,
      lessonId,
    );
    return this.sendSuccess(
      res,
      status,
      'Lesson status retrieved successfully',
    );
  }

  @Get('lesson/:lessonId/quiz-access')
  @ApiOperation({
    summary: 'Check whether the student may access the quiz',
    description:
      'Returns { canAccess: true } only when the video has been watched.',
  })
  @ApiParam({ name: 'lessonId', description: 'MongoDB ObjectId of the lesson' })
  @ApiResponse({ status: 200, description: '{ canAccess: boolean }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async canAccessQuiz(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const canAccess = await this.sequentialLearningService.canAccessQuiz(
      user.id,
      lessonId,
    );
    return this.sendSuccess(res, { canAccess }, 'Quiz access status retrieved');
  }
}
