import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto, FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserDto } from './dto/user.dto';
import { UserStatisticsDto } from './dto/user-statistics.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FilterUserDto, SortUserDto, UserStatisticsDto)
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() dto: CreateUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.create(dto);
    return this.sendSuccess(
      res,
      user,
      'User created successfully',
      HttpStatus.CREATED,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // READ
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * List users with combined pagination + multi-field filter + multi-field sort.
   *
   * Filter fields (all optional, combined with AND):
   *   roles[]           — filter by one or more UserRole values
   *   isActive          — true / false
   *   isDeleted         — true shows soft-deleted records (Admin audit)
   *   emailVerificationStatus
   *   email             — partial case-insensitive match
   *
   * Sort: array of { orderBy: keyof User, order: "asc"|"desc" } applied in order.
   */
  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'List users — paginated, filterable, sortable (Admin only)',
  })
  @ApiResponse({ status: 200, type: InfinityPaginationResponse(UserDto) })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() query: QueryUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.usersService.findAll(query);
    return this.sendSuccess(res, data, 'Users retrieved successfully');
  }

  @Get('admin/stats')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    type: UserStatisticsDto,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStatistics(@Res() res: Response): Promise<Response> {
    const stats = await this.usersService.getStatistics();
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.findById(id);
    if (!user) {
      return this.sendError(
        res,
        'User not found',
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, user, 'User retrieved successfully');
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Update user active status explicitly (Admin only)',
  })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.updateStatus(id, dto.isActive);
    return this.sendSuccess(
      res,
      user,
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SOFT DELETE
  // ──────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary:
      'Soft-delete user by ID (Admin only). Sets isDeleted=true; record is preserved.',
  })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.usersService.delete(id);
    return this.sendSuccess(res, null, 'User deleted successfully');
  }
}
