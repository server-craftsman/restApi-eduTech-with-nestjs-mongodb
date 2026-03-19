import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole, Difficulty } from '../enums';

@ApiTags('Questions')
@Controller('questions')
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions',
})
export class QuestionController extends BaseController {
  constructor(private readonly questionService: QuestionService) {
    super();
  }

  /**
   * Create a new question
   * Only TEACHER and ADMIN can create
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new question (TEACHER/ADMIN only)',
    description:
      'Create a new quiz question. Only teachers and administrators can create questions.',
  })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: QuestionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid question data',
  })
  async createQuestion(
    @Body() dto: CreateQuestionDto,
    @Res() res: Response,
  ): Promise<Response> {
    const question = await this.questionService.createQuestion(dto);
    return this.sendSuccess(
      res,
      question,
      'Question created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all questions
   * Public endpoint
   */
  @Get()
  @ApiOperation({
    summary: 'Get all questions',
    description: 'Retrieve all questions in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionDto],
  })
  async getAllQuestions(@Res() res: Response): Promise<Response> {
    const questions = await this.questionService.getAllQuestions();
    return this.sendSuccess(res, questions, 'Questions retrieved successfully');
  }

  /**
   * Get questions by lesson
   * Public endpoint
   */
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Get questions by lesson',
    description: 'Retrieve all questions associated with a specific lesson',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionDto],
  })
  async getByLessonId(
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const questions = await this.questionService.findByLessonId(lessonId);
    return this.sendSuccess(res, questions, 'Questions retrieved successfully');
  }

  /**
   * Get questions by difficulty
   * Public endpoint
   */
  @Get('difficulty/:difficulty')
  @ApiOperation({
    summary: 'Get questions by difficulty level',
    description: 'Retrieve all questions of a specific difficulty level',
  })
  @ApiParam({
    name: 'difficulty',
    description: 'Difficulty level',
    enum: Difficulty,
    example: Difficulty.Medium,
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionDto],
  })
  async getByDifficulty(
    @Param('difficulty') difficulty: Difficulty,
    @Res() res: Response,
  ): Promise<Response> {
    const questions = await this.questionService.findByDifficulty(difficulty);
    return this.sendSuccess(res, questions, 'Questions retrieved successfully');
  }

  /**
   * Get questions by tag
   * Public endpoint
   */
  @Get('tag/:tag')
  @ApiOperation({
    summary: 'Get questions by tag',
    description: 'Retrieve all questions with a specific tag',
  })
  @ApiParam({
    name: 'tag',
    description: 'Tag name',
    example: 'geography',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionDto],
  })
  async getByTag(
    @Param('tag') tag: string,
    @Res() res: Response,
  ): Promise<Response> {
    const questions = await this.questionService.findByTag(tag);
    return this.sendSuccess(res, questions, 'Questions retrieved successfully');
  }

  /**
   * Get random questions
   * Public endpoint
   */
  @Get('random/questions')
  @ApiOperation({
    summary: 'Get random questions',
    description: 'Retrieve random questions from the system',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of random questions (default: 5)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Random questions retrieved successfully',
    type: [QuestionDto],
  })
  async getRandomQuestions(
    @Query('limit') limit: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    const parsedLimit = limit ? parseInt(limit) : 5;
    const questions = await this.questionService.getRandomQuestion(parsedLimit);

    return this.sendSuccess(
      res,
      questions,
      'Random questions retrieved successfully',
    );
  }

  /**
   * Get random questions by difficulty
   * Public endpoint
   */
  @Get('random/difficulty/:difficulty')
  @ApiOperation({
    summary: 'Get random questions by difficulty',
    description: 'Retrieve random questions of a specific difficulty level',
  })
  @ApiParam({
    name: 'difficulty',
    description: 'Difficulty level',
    enum: Difficulty,
    example: Difficulty.Hard,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of questions (default: 5)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionDto],
  })
  async getRandomByDifficulty(
    @Param('difficulty') difficulty: Difficulty,
    @Query('limit') limit: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    const parsedLimit = limit ? parseInt(limit) : 5;
    const questions = await this.questionService.getRandomByDifficulty(
      difficulty,
      parsedLimit,
    );

    return this.sendSuccess(res, questions, 'Questions retrieved successfully');
  }

  /**
   * Get question by ID
   * Public endpoint
   */
  @Get('id/:id')
  @ApiOperation({
    summary: 'Get question by ID',
    description: 'Retrieve a specific question by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Question retrieved successfully',
    type: QuestionDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestionById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const question = await this.questionService.getQuestionById(id);
    if (!question) {
      return this.sendError(
        res,
        'Question not found',
        'The requested question does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, question, 'Question retrieved successfully');
  }

  /**
   * Update a question
   * Only TEACHER and ADMIN can update
   */
  // @Put(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.Teacher, UserRole.Admin)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Update a question (TEACHER/ADMIN only)',
  //   description:
  //     'Update an existing question. Only teachers and administrators can update questions.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'Question ID',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Question updated successfully',
  //   type: QuestionDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request - Invalid update data',
  // })
  // @ApiResponse({ status: 404, description: 'Question not found' })
  // async updateQuestion(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateQuestionDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const question = await this.questionService.updateQuestion(id, dto);
  //   return this.sendSuccess(res, question, 'Question updated successfully');
  // }

  // /**
  //  * Delete a question
  //  * Only ADMIN can delete
  //  */
  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.Admin)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Delete a question (ADMIN only)',
  //   description:
  //     'Soft-delete a question. Only administrators can delete questions.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'Question ID',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Question deleted successfully',
  // })
  // @ApiResponse({ status: 404, description: 'Question not found' })
  // async deleteQuestion(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.questionService.deleteQuestion(id);
  //   return this.sendSuccess(res, null, 'Question deleted successfully');
  // }
}
