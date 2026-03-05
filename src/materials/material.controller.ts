import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { MaterialService } from './material.service';
import { CreateMaterialDto, UpdateMaterialDto, MaterialDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';

@ApiTags('Materials')
@Controller('materials')
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions',
})
export class MaterialController extends BaseController {
  constructor(private readonly materialService: MaterialService) {
    super();
  }

  /**
   * Create a new material
   * Only TEACHER and ADMIN can create materials
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new material (TEACHER/ADMIN only)',
    description:
      'Create a new material/resource for a lesson. Only teachers and administrators can create materials.',
  })
  @ApiResponse({
    status: 201,
    description: 'Material created successfully',
    type: MaterialDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid material data',
  })
  async createMaterial(
    @Body() dto: CreateMaterialDto,
    @Res() res: Response,
  ): Promise<Response> {
    const material = await this.materialService.createMaterial(dto);
    return this.sendSuccess(
      res,
      material,
      'Material created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all materials for a lesson
   * Public endpoint
   */
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Get all materials for a lesson',
    description: 'Retrieve all materials/resources associated with a lesson',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Materials retrieved successfully',
    type: [MaterialDto],
  })
  async getByLessonId(
    @Param('lessonId') lessonId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const materials = await this.materialService.findByLessonId(lessonId);
    return this.sendSuccess(res, materials, 'Materials retrieved successfully');
  }

  /**
   * Get material by ID
   * Public endpoint
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get material by ID',
    description: 'Retrieve a specific material by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Material ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Material retrieved successfully',
    type: MaterialDto,
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async getMaterialById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const material = await this.materialService.getMaterialById(id);
    if (!material) {
      return this.sendError(
        res,
        'Material not found',
        'The requested material does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, material, 'Material retrieved successfully');
  }

  /**
   * Get all materials
   * Public endpoint
   */
  @Get()
  @ApiOperation({
    summary: 'Get all materials',
    description: 'Retrieve all materials in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Materials retrieved successfully',
    type: [MaterialDto],
  })
  async getAllMaterials(@Res() res: Response): Promise<Response> {
    const materials = await this.materialService.getAllMaterials();
    return this.sendSuccess(res, materials, 'Materials retrieved successfully');
  }

  /**
   * Update a material
   * Only TEACHER and ADMIN can update materials
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Teacher, UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a material (TEACHER/ADMIN only)',
    description:
      'Update an existing material. Only teachers and administrators can update materials.',
  })
  @ApiParam({
    name: 'id',
    description: 'Material ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Material updated successfully',
    type: MaterialDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid update data',
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @Res() res: Response,
  ): Promise<Response> {
    const material = await this.materialService.updateMaterial(id, dto);
    return this.sendSuccess(res, material, 'Material updated successfully');
  }

  /**
   * Increment download counter
   * Public endpoint - track material downloads
   */
  @Patch(':id/download')
  @ApiOperation({
    summary: 'Record material download',
    description: 'Increment the download counter for a material',
  })
  @ApiParam({
    name: 'id',
    description: 'Material ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Download recorded successfully',
    type: MaterialDto,
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async recordDownload(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const material = await this.materialService.incrementDownloadCount(id);
    if (!material) {
      return this.sendError(
        res,
        'Material not found',
        'The requested material does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, material, 'Download recorded successfully');
  }

  /**
   * Delete a material
   * Only ADMIN can delete materials
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a material (ADMIN only)',
    description:
      'Soft-delete a material. Only administrators can delete materials.',
  })
  @ApiParam({
    name: 'id',
    description: 'Material ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Material deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async deleteMaterial(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.materialService.deleteMaterial(id);
    return this.sendSuccess(res, null, 'Material deleted successfully');
  }
}
