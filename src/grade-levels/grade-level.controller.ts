import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { GradeLevelService } from './grade-level.service';
import { CreateGradeLevelDto, UpdateGradeLevelDto, GradeLevelDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';

@ApiTags('Grade Levels')
@Controller('grade-levels')
@ApiExtraModels(CreateGradeLevelDto, UpdateGradeLevelDto, GradeLevelDto)
export class GradeLevelController extends BaseController {
  constructor(private readonly gradeLevelService: GradeLevelService) {
    super();
  }

  /**
   * Create a new grade level (ADMIN only)
   * POST /grade-levels
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new grade level (ADMIN only)',
    description:
      'Create a new grade level in the system. Only administrators can perform this action.',
  })
  @ApiResponse({
    status: 201,
    description: 'Grade level created successfully',
    type: GradeLevelDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or grade level already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - no JWT token provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (not an admin)',
  })
  async createGradeLevel(
    @Body() data: CreateGradeLevelDto,
    @Res() res: Response,
  ): Promise<Response> {
    const gradeLevel = await this.gradeLevelService.createGradeLevel(data);
    return this.sendSuccess(
      res,
      gradeLevel,
      'Grade level created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all grade levels (PUBLIC)
   * GET /grade-levels
   */
  @Get()
  @ApiOperation({
    summary: 'Get all grade levels',
    description:
      'Retrieve a list of all grade levels in the system. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of grade levels retrieved successfully',
    type: [GradeLevelDto],
  })
  async getAllGradeLevels(@Res() res: Response): Promise<Response> {
    const gradeLevels = await this.gradeLevelService.getAllGradeLevels();
    return this.sendSuccess(
      res,
      gradeLevels,
      'Grade levels retrieved successfully',
    );
  }

  /**
   * Get grade level by ID (PUBLIC)
   * GET /grade-levels/:id
   */
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Grade level MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOperation({
    summary: 'Get grade level by ID',
    description:
      'Retrieve a specific grade level by its ID. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Grade level retrieved successfully',
    type: GradeLevelDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level not found',
  })
  async getGradeLevelById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const gradeLevel = await this.gradeLevelService.getGradeLevelById(id);
    if (!gradeLevel) {
      return this.sendError(
        res,
        'Grade level not found',
        'Grade level not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      gradeLevel,
      'Grade level retrieved successfully',
    );
  }

  /**
   * Get grade level by numeric value (PUBLIC)
   * GET /grade-levels/value/:value
   */
  @Get('value/:value')
  @ApiParam({
    name: 'value',
    description: 'Numeric grade level value (0-12)',
    example: '10',
  })
  @ApiOperation({
    summary: 'Get grade level by numeric value',
    description:
      'Retrieve a grade level by its numeric value (0-12). Useful for querying by grade. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Grade level retrieved successfully',
    type: GradeLevelDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level with that value not found',
  })
  async getByValue(
    @Param('value') value: string,
    @Res() res: Response,
  ): Promise<Response> {
    const gradeLevel = await this.gradeLevelService.findByValue(
      parseInt(value),
    );
    if (!gradeLevel) {
      return this.sendError(
        res,
        'Grade level not found',
        `Grade level with value ${value} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      gradeLevel,
      'Grade level retrieved successfully',
    );
  }

  /**
   * Update a grade level (ADMIN only)
   * PUT /grade-levels/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Grade level MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOperation({
    summary: 'Update a grade level (ADMIN only)',
    description:
      'Update specific fields of a grade level. Only administrators can perform this action.',
  })
  @ApiResponse({
    status: 200,
    description: 'Grade level updated successfully',
    type: GradeLevelDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or duplicate name/value',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - no JWT token provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (not an admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level not found',
  })
  async updateGradeLevel(
    @Param('id') id: string,
    @Body() data: UpdateGradeLevelDto,
    @Res() res: Response,
  ): Promise<Response> {
    const updatedGradeLevel = await this.gradeLevelService.updateGradeLevel(
      id,
      data,
    );
    if (!updatedGradeLevel) {
      return this.sendError(
        res,
        'Grade level not found',
        `Grade level with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      updatedGradeLevel,
      'Grade level updated successfully',
    );
  }

  /**
   * Delete a grade level (ADMIN only)
   * DELETE /grade-levels/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Grade level MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOperation({
    summary: 'Delete a grade level (ADMIN only)',
    description:
      'Permanently delete a grade level from the system. Only administrators can perform this action.',
  })
  @ApiResponse({
    status: 200,
    description: 'Grade level deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - no JWT token provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (not an admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level not found',
  })
  async deleteGradeLevel(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.gradeLevelService.deleteGradeLevel(id);
    return this.sendSuccess(res, null, 'Grade level deleted successfully');
  }

  /**
   * Seed 12 grade levels (ADMIN only)
   * POST /grade-levels/seed
   * Creates Vietnamese education system grades 0-12
   */
  @Post('seed/data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Seed 12 Vietnamese grade levels (ADMIN only)',
    description:
      'Populate the database with 12 grade levels (Mầm non, Lớp 1-12) for the Vietnamese education system. Only call once during initialization. Only administrators can perform this action.',
  })
  @ApiResponse({
    status: 201,
    description: '12 grade levels created successfully',
    type: [GradeLevelDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Grade levels already exist in the database',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - no JWT token provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (not an admin)',
  })
  async seedGradeLevels(@Res() res: Response): Promise<Response> {
    const gradeLevels = await this.gradeLevelService.seedGradeLevels();
    return this.sendSuccess(
      res,
      gradeLevels,
      `${gradeLevels.length} grade levels seeded successfully`,
      HttpStatus.CREATED,
    );
  }
}
