/* eslint-disable @typescript-eslint/no-unsafe-argument */
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

@ApiTags('Quiz Attempts')
@Controller('quiz-attempts')
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
   * Submit a quiz attempt
   * Students submit their quiz answers
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a quiz attempt',
    description:
      'Record a student quiz submission with answers and calculated score',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz attempt submitted successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid submission data',
  })
  async submitAttempt(
    @Body() dto: CreateQuizAttemptDto,
    @Res() res: Response,
  ): Promise<Response> {
    const attempt = await this.quizAttemptService.submitAttempt(dto);
    return this.sendSuccess(
      res,
      attempt,
      'Quiz attempt submitted successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all quiz attempts (ADMIN only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
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
   * Get attempt by ID
   * Student can view their own, ADMIN can view any
   */
  @Get('id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get quiz attempt by ID',
    description:
      'Retrieve a specific quiz attempt. Students can only view their own attempts',
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
   * Get user's quiz attempts
   * Student can view own, ADMIN can view any
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user's quiz attempts",
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
   * Get all attempts for a specific quiz (ADMIN/TEACHER)
   */
  @Get('quiz/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all attempts for a quiz (ADMIN/TEACHER only)',
    description: 'Retrieve all student attempts for a specific quiz',
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [QuizAttemptDto],
  })
  async getQuizAttempts(
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const attempts = await this.quizAttemptService.getQuizAttempts(quizId);
    return this.sendSuccess(res, attempts, 'Attempts retrieved successfully');
  }

  /**
   * Get user's best attempt for a quiz
   */
  @Get('best/user/:userId/quiz/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user's best attempt for a quiz",
    description:
      'Retrieve the highest scoring attempt for a user in a specific quiz',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Best attempt retrieved successfully',
    type: QuizAttemptDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No attempts found for this user and quiz',
  })
  async getBestAttempt(
    @Param('userId') userId: string,
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const bestAttempt = await this.quizAttemptService.getBestAttempt(
      userId,
      quizId,
    );
    if (!bestAttempt) {
      return this.sendError(
        res,
        'No attempts found',
        'User has not attempted this quiz',
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
   * Get user's statistics
   */
  @Get('stats/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user's quiz statistics",
    description: 'Retrieve aggregate statistics for a user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalAttempts: { type: 'number', example: 5 },
        completedAttempts: { type: 'number', example: 5 },
        averageScore: { type: 'number', example: 78 },
        bestScore: { type: 'number', example: 92 },
        totalTimeSpentMs: { type: 'number', example: 450000 },
      },
    },
  })
  async getUserStatistics(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const stats = await this.quizAttemptService.getUserStatistics(userId);
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  /**
   * Get quiz statistics (ADMIN/TEACHER)
   */
  @Get('stats/quiz/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get quiz statistics (ADMIN/TEACHER only)',
    description:
      'Retrieve aggregate statistics for all attempts in a quiz (average score, pass rate, etc.)',
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalAttempts: { type: 'number', example: 32 },
        averageScore: { type: 'number', example: 72 },
        highestScore: { type: 'number', example: 100 },
        lowestScore: { type: 'number', example: 25 },
        passRate: { type: 'number', example: 78 },
      },
    },
  })
  async getQuizStatistics(
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const stats = await this.quizAttemptService.getQuizStatistics(quizId);
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  /**
   * Check if user can retry quiz
   */
  @Get('can-retry/user/:userId/quiz/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if user can retry quiz',
    description: 'Determine if a user has remaining attempts for a quiz',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439013',
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
    schema: {
      type: 'object',
      properties: {
        canRetry: { type: 'boolean', example: true },
        attemptCount: { type: 'number', example: 2 },
        maxAttempts: { type: 'number', example: 3 },
        remainingAttempts: { type: 'number', example: 1 },
      },
    },
  })
  async canRetry(
    @Param('userId') userId: string,
    @Param('quizId') quizId: string,
    @Query('maxAttempts') maxAttempts?: string,
    @Res() res?: Response,
  ): Promise<Response> {
    const max = maxAttempts ? parseInt(maxAttempts) : 3;
    const canRetry = await this.quizAttemptService.canRetry(
      userId,
      quizId,
      max,
    );
    const attemptCount = await this.quizAttemptService.getAttemptCount(
      userId,
      quizId,
    );

    return this.sendSuccess(
      res as any,
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
   * Used for re-grading or correcting scores
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update quiz attempt (ADMIN only)',
    description:
      'Update attempt score, status, or other details. Only administrators can update attempts',
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
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid update data',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete quiz attempt (ADMIN only)',
    description:
      'Soft-delete a quiz attempt. Only administrators can delete attempts',
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
