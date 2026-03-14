import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AdminService } from './admin.service';
import {
  AdminDashboardDto,
  UserStatsDto,
  CourseStatsDto,
  RevenueStatsDto,
  SubscriptionStatsDto,
} from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@ApiBearerAuth()
@ApiExtraModels(
  AdminDashboardDto,
  UserStatsDto,
  CourseStatsDto,
  RevenueStatsDto,
  SubscriptionStatsDto,
)
export class AdminController extends BaseController {
  constructor(private readonly adminService: AdminService) {
    super();
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({
    summary: 'Admin platform dashboard — aggregated stats (Admin only)',
    description:
      'Returns users, courses, revenue and subscription statistics in one request. ' +
      'All sub-queries run in parallel for maximum performance.',
  })
  @ApiResponse({
    status: 200,
    type: AdminDashboardDto,
    description: 'Dashboard stats retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getDashboard(@Res() res: Response): Promise<Response> {
    const stats = await this.adminService.getDashboardStats();
    return this.sendSuccess(
      res,
      stats,
      'Dashboard stats retrieved successfully',
    );
  }

  // ─── Teacher Approval ───────────────────────────────────────────────────────

  @Get('teachers/pending')
  @ApiOperation({
    summary: 'List teachers pending approval (Admin only)',
    description:
      'Returns paginated list of Teacher accounts with approvalStatus=PENDING_APPROVAL.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Pending teachers listed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getPendingTeachers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.adminService.getPendingTeachers(
      Number(page),
      Number(limit),
    );
    return this.sendSuccess(
      res,
      result,
      'Pending teachers retrieved successfully',
    );
  }

  // @Patch('teachers/:userId/approve')
  // @ApiOperation({
  //   summary: 'Approve a pending teacher account (Admin only)',
  //   description:
  //     'Sets approvalStatus=Approved, activates the account, records reviewer. ' +
  //     'Sends notification to the teacher.',
  // })
  // @ApiParam({ name: 'userId', description: 'Teacher user ObjectId' })
  // @ApiResponse({ status: 200, description: 'Teacher approved successfully' })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Not a teacher or not pending approval',
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async approveTeacher(
  //   @Param('userId') userId: string,
  //   @CurrentUser() admin: User,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const teacher = await this.adminService.approveTeacher(admin.id, userId);
  //   return this.sendSuccess(res, teacher, 'Teacher approved successfully');
  // }

  // @Patch('teachers/:userId/reject')
  // @ApiOperation({
  //   summary: 'Reject a teacher account (Admin only)',
  //   description:
  //     'Sets approvalStatus=Rejected, deactivates the account, stores rejection reason. ' +
  //     'Sends notification to the teacher with the reason.',
  // })
  // @ApiParam({ name: 'userId', description: 'Teacher user ObjectId' })
  // @ApiResponse({ status: 200, description: 'Teacher rejected successfully' })
  // @ApiResponse({ status: 400, description: 'Not a teacher, or missing reason' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async rejectTeacher(
  //   @Param('userId') userId: string,
  //   @CurrentUser() admin: User,
  //   @Body() dto: RejectTeacherDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const teacher = await this.adminService.rejectTeacher(
  //     admin.id,
  //     userId,
  //     dto.reason,
  //   );
  //   return this.sendSuccess(res, teacher, 'Teacher rejected successfully');
  // }
}
