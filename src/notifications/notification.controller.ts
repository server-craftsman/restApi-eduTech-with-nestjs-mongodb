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
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationDto } from './dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController extends BaseController {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  // ─── User endpoints (own notifications) ────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user notifications (latest 50)' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  async getMyNotifications(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const notifications = await this.notificationService.findByUserId(user.id);
    return this.sendSuccess(
      res,
      notifications,
      'Notifications retrieved successfully',
    );
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Get current user unread notification count' })
  @ApiResponse({ status: 200 })
  async getMyUnreadCount(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const unreadCount = await this.notificationService.getUnreadCount(user.id);
    return this.sendSuccess(
      res,
      { unreadCount },
      'Unread count retrieved successfully',
    );
  }

  @Put('me/mark-all-as-read')
  @ApiOperation({ summary: 'Mark all current user notifications as read' })
  @ApiResponse({ status: 200 })
  async markAllAsRead(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    await this.notificationService.markAllAsRead(user.id);
    return this.sendSuccess(
      res,
      null,
      'All notifications marked as read',
    );
  }

  @Put(':id/mark-as-read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const notification = await this.notificationService.markAsRead(id);
    if (!notification) {
      return this.sendError(
        res,
        'Notification not found',
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      notification,
      'Notification marked as read',
    );
  }

  @Put('mark-multiple-as-read')
  @ApiOperation({ summary: 'Mark multiple notifications as read by IDs' })
  @ApiResponse({ status: 200 })
  async markMultipleAsRead(
    @Body('ids') ids: string[],
    @Res() res: Response,
  ): Promise<Response> {
    await this.notificationService.markMultipleAsRead(ids);
    return this.sendSuccess(
      res,
      null,
      'Notifications marked as read',
    );
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete all current user notifications' })
  @ApiResponse({ status: 200 })
  async deleteMyNotifications(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    await this.notificationService.deleteByUserId(user.id);
    return this.sendSuccess(
      res,
      null,
      'All notifications deleted successfully',
    );
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  @Get('admin/all')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get all notifications (Admin only)' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  async getAllNotifications(@Res() res: Response): Promise<Response> {
    const notifications = await this.notificationService.getAllNotifications();
    return this.sendSuccess(
      res,
      notifications,
      'All notifications retrieved successfully',
    );
  }

  @Get('admin/user/:userId')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get notifications by user ID (Admin only)' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  async getByUserId(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const notifications = await this.notificationService.findByUserId(userId);
    return this.sendSuccess(
      res,
      notifications,
      'User notifications retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotificationById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const notification = await this.notificationService.getNotificationById(id);
    if (!notification) {
      return this.sendError(
        res,
        'Notification not found',
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(
      res,
      notification,
      'Notification retrieved successfully',
    );
  }

  @Post('admin')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a notification manually (Admin only)' })
  @ApiResponse({ status: 201, type: NotificationDto })
  async createNotification(
    @Body() data: CreateNotificationDto,
    @Res() res: Response,
  ): Promise<Response> {
    const notification = await this.notificationService.createNotification({
      ...data,
      isRead: false,
      emailSent: false,
      novuMessageId: null,
    });
    return this.sendSuccess(
      res,
      notification,
      'Notification created successfully',
      HttpStatus.CREATED,
    );
  }

  @Delete('admin/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a notification (Admin only)' })
  @ApiResponse({ status: 200 })
  async deleteNotification(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.notificationService.deleteNotification(id);
    return this.sendSuccess(
      res,
      null,
      'Notification deleted successfully',
    );
  }

  @Delete('admin/user/:userId')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete all notifications for a user (Admin only)' })
  @ApiResponse({ status: 200 })
  async deleteByUserId(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.notificationService.deleteByUserId(userId);
    return this.sendSuccess(
      res,
      null,
      'All notifications for user deleted successfully',
    );
  }
}
