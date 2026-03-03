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
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { SubjectService } from './subject.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  SubjectDto,
  SubjectIconDto,
  FilterSubjectDto,
  SortSubjectDto,
} from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { UserRole } from '../enums';

@ApiTags('Subjects')
@Controller('subjects')
// Register auxiliary DTOs that are not used directly as @Body() / @ApiResponse types
@ApiExtraModels(SubjectDto, SubjectIconDto, FilterSubjectDto, SortSubjectDto)
export class SubjectController extends BaseController {
  constructor(private readonly subjectService: SubjectService) {
    super();
  }

  // â”€â”€ Public read endpoints (no auth required) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get()
  @ApiOperation({
    summary: 'List subjects with pagination, filters and sort (public)',
    description:
      'Supports JSON-encoded `filters` and `sort` query params. ' +
      'Example: `?filters={"name":"toÃ¡n"}&sort=[{"orderBy":"createdAt","order":"desc"}]`',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subjects retrieved successfully',
    type: SubjectDto,
    isArray: true,
  })
  async getAllSubjects(
    @Query() query: QuerySubjectDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { subjects, total } =
      await this.subjectService.getAllSubjectsWithFilter(query);
    return this.sendPaginated(
      res,
      subjects,
      total,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get subject by slug (public)' })
  @ApiParam({ name: 'slug', description: 'Subject slug', example: 'toan-hoc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject retrieved successfully',
    type: SubjectDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
  })
  async getBySlug(
    @Param('slug') slug: string,
    @Res() res: Response,
  ): Promise<Response> {
    const subject = await this.subjectService.getSubjectBySlug(slug);
    return this.sendSuccess(res, subject, 'Subject retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID (public)' })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject retrieved successfully',
    type: SubjectDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
  })
  async getSubjectById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const subject = await this.subjectService.getSubjectById(id);
    return this.sendSuccess(res, subject, 'Subject retrieved successfully');
  }

  // â”€â”€ Protected write endpoints (Admin / Teacher only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new subject (Admin / Teacher only)',
    description:
      'Slug is **auto-generated** from the `name` field (supports Vietnamese). ' +
      'Upload the icon first via `POST /uploads?subfolder=subjects` and pass the ' +
      'returned `publicId` + `url` as the `iconUrl` object.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subject created successfully',
    type: SubjectDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden â€” Admin or Teacher role required',
  })
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @Res() res: Response,
  ): Promise<Response> {
    const subject = await this.subjectService.createSubject(dto);
    return this.sendSuccess(
      res,
      subject,
      'Subject created successfully',
      HttpStatus.CREATED,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a subject (Admin / Teacher only)',
    description:
      'Slug is **automatically regenerated** when `name` changes. ' +
      'To update the icon upload a new file via `POST /uploads` first.',
  })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject updated successfully',
    type: SubjectDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden â€” Admin or Teacher role required',
  })
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @Res() res: Response,
  ): Promise<Response> {
    const subject = await this.subjectService.updateSubject(id, dto);
    return this.sendSuccess(res, subject, 'Subject updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete a subject (Admin only)',
    description:
      'Sets isDeleted=true and deletedAt=now. Record is hidden from all public endpoints. ' +
      'Use POST /:id/restore to undo.',
  })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject soft-deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden â€” Admin role required',
  })
  async deleteSubject(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.subjectService.softDeleteSubject(id);
    return this.sendSuccess(
      res,
      { id, deleted: true },
      'Subject deleted successfully',
    );
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore a soft-deleted subject (Admin only)',
    description: 'Sets isDeleted=false and deletedAt=null.',
  })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject restored successfully',
    type: SubjectDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found or not deleted',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden â€” Admin role required',
  })
  async restoreSubject(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const subject = await this.subjectService.restoreSubject(id);
    return this.sendSuccess(res, subject, 'Subject restored successfully');
  }
}
