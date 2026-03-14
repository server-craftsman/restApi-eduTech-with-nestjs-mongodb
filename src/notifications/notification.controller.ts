import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { NotificationService } from './notification.service';
import { NovuInboxContextDto } from './dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController extends BaseController {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  // ─── User endpoints (own notifications) ────────────────────────────────────

  // @Get('me')
  // @ApiOperation({ summary: 'Get current user notifications (latest 50)' })
  // @ApiResponse({ status: 200, type: [NotificationDto] })
  // async getMyNotifications(
  //   @CurrentUser() user: User,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const notifications = await this.notificationService.findByUserId(user.id);
  //   return this.sendSuccess(
  //     res,
  //     notifications,
  //     'Notifications retrieved successfully',
  //   );
  // }

  @Get('me/inbox-context')
  @ApiOperation({
    summary:
      'Get personalized Novu Inbox context for current authenticated user',
  })
  @ApiResponse({ status: 200, type: NovuInboxContextDto })
  async getMyInboxContext(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const context = await this.notificationService.getInboxContext(user.id);
    return this.sendSuccess(
      res,
      context,
      'Novu inbox context retrieved successfully',
    );
  }

  // @Get('me/unread-count')
  // @ApiOperation({ summary: 'Get current user unread notification count' })
  // @ApiResponse({ status: 200 })
  // async getMyUnreadCount(
  //   @CurrentUser() user: User,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const unreadCount = await this.notificationService.getUnreadCount(user.id);
  //   return this.sendSuccess(
  //     res,
  //     { unreadCount },
  //     'Unread count retrieved successfully',
  //   );
  // }

  // @Put('me/mark-all-as-read')
  // @ApiOperation({ summary: 'Mark all current user notifications as read' })
  // @ApiResponse({ status: 200 })
  // async markAllAsRead(
  //   @CurrentUser() user: User,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.notificationService.markAllAsRead(user.id);
  //   return this.sendSuccess(res, null, 'All notifications marked as read');
  // }

  // @Put(':id/mark-as-read')
  // @ApiOperation({ summary: 'Mark a single notification as read' })
  // @ApiResponse({ status: 200, type: NotificationDto })
  // @ApiResponse({ status: 404, description: 'Notification not found' })
  // async markAsRead(
  //   @CurrentUser() user: User,
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const notification = await this.notificationService.markAsRead(user.id, id);
  //   if (!notification) {
  //     return this.sendError(
  //       res,
  //       'Notification not found',
  //       'Notification not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   return this.sendSuccess(res, notification, 'Notification marked as read');
  // }

  // @Put('mark-multiple-as-read')
  // @ApiOperation({ summary: 'Mark multiple notifications as read by IDs' })
  // @ApiResponse({ status: 200 })
  // async markMultipleAsRead(
  //   @CurrentUser() user: User,
  //   @Body('ids') ids: string[],
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.notificationService.markMultipleAsRead(user.id, ids);
  //   return this.sendSuccess(res, null, 'Notifications marked as read');
  // }

  // @Get('me/:id')
  // @ApiOperation({ summary: 'Get current user notification by ID' })
  // @ApiResponse({ status: 200, type: NotificationDto })
  // @ApiResponse({ status: 404, description: 'Notification not found' })
  // async getNotificationById(
  //   @CurrentUser() user: User,
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const list = await this.notificationService.findByUserId(user.id);
  //   const notification = list.find((item) => item.id === id) ?? null;
  //   if (!notification) {
  //     return this.sendError(
  //       res,
  //       'Notification not found',
  //       'Notification not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   return this.sendSuccess(
  //     res,
  //     notification,
  //     'Notification retrieved successfully',
  //   );
  // }
}
