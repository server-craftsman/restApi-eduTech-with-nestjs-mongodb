import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { QuizAttemptService } from './quiz-attempt.service';
import {
  CreateQuizAttemptDto,
  UpdateQuizAttemptDto,
  QuizAttemptDto,
} from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';

@ApiTags('Quiz Attempts')
@Controller('quiz-attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions',
})
export class QuizAttemptController extends BaseController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {
    super();
  }

  /**
   * Submit a quiz attempt — server grades the answers automatically
   */
  @Post()
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Submit a quiz attempt (server-side grading)',
    description:
      'Submit quiz answers for a lesson. The server fetches the correct answers and grades automatically. userId is extracted from JWT token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz attempt submitted and graded successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid submission data',
  })
  async submitAttempt(
    @Body() dto: CreateQuizAttemptDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const attempt = await this.quizAttemptService.submitAttempt(user.id, dto);
    return this.sendSuccess(
      res,
      attempt,
      'Quiz attempt submitted and graded successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all quiz attempts (ADMIN only)
   */
  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get all quiz attempts (ADMIN only)',
    description: 'Retrieve all quiz attempts in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [QuizAttemptDto],
  })
  async getAllAttempts(@Res() res: Response): Promise<Response> {
    const attempts = await this.quizAttemptService.getAllAttempts();
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }

  /**
   * Get current user's own attempts
   */
  @Get('my-attempts')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: "Get current user's quiz attempts",
    description: 'Retrieve all quiz attempts for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [QuizAttemptDto],
  })
  async getMyAttempts(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const attempts = await this.quizAttemptService.getUserAttempts(user.id);
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }

  /**
   * Get attempt by ID
   */
  @Get('id/:id')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get quiz attempt by ID',
    description: 'Retrieve a specific quiz attempt by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Attempt ID',
    example: '507f1f77bcf86cd799439001',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempt retrieved successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async getAttemptById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const attempt = await this.quizAttemptService.getAttemptById(id);
    if (!attempt) {
      return this.sendError(
        res,
        'Attempt not found',
        'The requested quiz attempt does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, attempt, 'Attempt retrieved successfully');
  }

  /**
   * Get user's quiz attempts (ADMIN can view any user)
   */
  @Get('user/:userId')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: "Get a user's quiz attempts (ADMIN only)",
    description: 'Retrieve all quiz attempts for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [QuizAttemptDto],
  })
  async getUserAttempts(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const attempts = await this.quizAttemptService.getUserAttempts(userId);
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }

  /**
   * Get all attempts for a specific lesson (ADMIN/TEACHER)
   */
  @Get('lesson/:lessonId')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get all attempts for a lesson quiz (ADMIN/TEACHER only)',
    description: 'Retrieve all student attempts for a specific lesson',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [QuizAttemptDto],
  })
  async getLessonAttempts(
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const attempts = await this.quizAttemptService.getLessonAttempts(lessonId);
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }

  /**
   * Get current user's best attempt for a lesson
   */
  @Get('best/lesson/:lessonId')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: "Get current user's best attempt for a lesson quiz",
    description:
      'Retrieve the highest scoring attempt for the authenticated user in a specific lesson',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 200,
    description: 'Best attempt retrieved successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No attempts found for this lesson',
  })
  async getBestAttempt(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const bestAttempt = await this.quizAttemptService.getBestAttempt(
      user.id,
      lessonId,
    );
    if (!bestAttempt) {
      return this.sendError(
        res,
        'No attempts found',
        'You have not attempted this lesson quiz',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      bestAttempt,
      'Best attempt retrieved successfully',
    );
  }

  /**
   * Get current user's statistics
   */
  @Get('stats/me')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: "Get current user's quiz statistics",
    description: 'Retrieve aggregate statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getMyStatistics(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const stats = await this.quizAttemptService.getUserStatistics(user.id);
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  /**
   * Get lesson quiz statistics (ADMIN/TEACHER)
   */
  @Get('stats/lesson/:lessonId')
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get lesson quiz statistics (ADMIN/TEACHER only)',
    description:
      'Retrieve aggregate statistics for all attempts in a lesson quiz',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getLessonStatistics(
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const stats = await this.quizAttemptService.getLessonStatistics(lessonId);
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  /**
   * Check if current user can retry lesson quiz
   */
  @Get('can-retry/lesson/:lessonId')
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Check if current user can retry lesson quiz',
    description:
      'Determine if the authenticated user has remaining attempts for a lesson quiz',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439014',
  })
  @ApiQuery({
    name: 'maxAttempts',
    required: false,
    type: Number,
    description: 'Maximum allowed attempts (default: 3)',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Retry eligibility checked',
  })
  async canRetry(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
    @Query('maxAttempts') maxAttempts: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    const max = maxAttempts ? parseInt(maxAttempts) : 3;
    const canRetry = await this.quizAttemptService.canRetry(
      user.id,
      lessonId,
      max,
    );
    const attemptCount = await this.quizAttemptService.getAttemptCount(
      user.id,
      lessonId,
    );

    return this.sendSuccess(
      res,
      {
        canRetry,
        attemptCount,
        maxAttempts: max,
        remainingAttempts: Math.max(0, max - attemptCount),
      },
      'Retry eligibility determined',
    );
  }

  /**
   * Update attempt (ADMIN only)
   */
  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Update quiz attempt (ADMIN only)',
    description: 'Update attempt score, status, or other details',
  })
  @ApiParam({
    name: 'id',
    description: 'Attempt ID',
    example: '507f1f77bcf86cd799439001',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempt updated successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async updateAttempt(
    @Param('id') id: string,
    @Body() dto: UpdateQuizAttemptDto,
    @Res() res: Response,
  ): Promise<Response> {
    const attempt = await this.quizAttemptService.updateAttempt(id, dto);
    return this.sendSuccess(res, attempt, 'Attempt updated successfully');
  }

  /**
   * Delete quiz attempt (ADMIN only)
   */
  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Delete quiz attempt (ADMIN only)',
    description: 'Soft-delete a quiz attempt',
  })
  @ApiParam({
    name: 'id',
    description: 'Attempt ID',
    example: '507f1f77bcf86cd799439001',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempt deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async deleteAttempt(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.quizAttemptService.deleteAttempt(id);
    return this.sendSuccess(res, null, 'Attempt deleted successfully');
  }
}
