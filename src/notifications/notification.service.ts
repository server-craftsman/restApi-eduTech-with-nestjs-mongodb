import { BadRequestException, Injectable } from '@nestjs/common';
import { Notification } from './domain/notification';
import { NotificationType } from '../enums';
import { BaseService } from '../core/base/base.service';
import { NovuInboxContext, NovuService } from './services/novu.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationService extends BaseService {
  constructor(
    private readonly novuService: NovuService,
    private readonly usersService: UsersService,
  ) {
    super();
  }

  /**
   * Create an in-app notification directly (no external channels).
   * For multi-channel delivery use NotificationTriggersService instead.
   */
  async createNotification(
    data: Omit<Notification, 'id' | 'createdAt'>,
  ): Promise<Notification> {
    const user = await this.usersService.findById(data.userId);
    if (!user?.email) {
      throw new BadRequestException('Recipient user email not found');
    }

    const workflowIdMap: Record<NotificationType, string> = {
      [NotificationType.PointsEarned]: 'points-earned',
      [NotificationType.BadgeUnlocked]: 'badge-unlocked',
      [NotificationType.NewAssignment]: 'new-assignment',
      [NotificationType.NewCourse]: 'new-course',
      [NotificationType.ExamReminder]: 'exam-reminder',
      [NotificationType.StreakReminder]: 'streak-reminder',
      [NotificationType.InactiveReminder]: 'inactive-reminder',
      [NotificationType.SubscriptionUpdate]: 'subscription-update',
      [NotificationType.PaymentConfirmed]: 'payment-confirmed',
      [NotificationType.SystemAnnouncement]: 'system-announcement',
      [NotificationType.QuizResult]: 'quiz-result',
      [NotificationType.ParentLinkUpdate]: 'parent-link-update',
      [NotificationType.CourseApproval]: 'course-approval',
      [NotificationType.TeacherApproval]: 'teacher-approval',
    };

    const txId = await this.novuService.triggerWorkflow({
      workflowId: workflowIdMap[data.type] ?? 'system-announcement',
      userId: data.userId,
      email: user.email,
      firstName: user.email.split('@')[0],
      title: data.title,
      message: data.message,
      type: data.type,
      actionUrl: data.actionUrl ?? undefined,
      metadata: data.metadata ?? undefined,
    });

    return {
      id: txId ?? `novu-${Date.now()}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      isRead: false,
      type: data.type,
      actionUrl: data.actionUrl ?? null,
      metadata: data.metadata ?? null,
      emailSent: data.emailSent,
      novuMessageId: txId,
      createdAt: new Date(),
    };
  }

  getNotificationById(id: string): Promise<Notification | null> {
    return Promise.reject(
      new BadRequestException(
        `Get by ID (${id}) is not supported in Novu-only mode without user context`,
      ),
    );
  }

  getAllNotifications(): Promise<Notification[]> {
    return Promise.reject(
      new BadRequestException(
        'Get all notifications is not supported in Novu-only mode',
      ),
    );
  }

  deleteNotification(id: string): Promise<void> {
    return Promise.reject(
      new BadRequestException(
        `Delete notification (${id}) is not supported in Novu-only mode`,
      ),
    );
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const feed = await this.novuService.getUserFeed(userId);
    return feed.map((item) => ({
      id: item.id,
      userId,
      title: item.title,
      message: item.message,
      isRead: item.isRead,
      type: item.type,
      actionUrl: item.actionUrl ?? null,
      metadata: item.metadata ?? null,
      emailSent: false,
      novuMessageId: item.id,
      createdAt: item.createdAt,
    }));
  }

  async findByUserIdAndType(
    userId: string,
    type: NotificationType,
  ): Promise<Notification[]> {
    const list = await this.findByUserId(userId);
    return list.filter((n) => n.type === type);
  }

  async markAsRead(userId: string, id: string): Promise<Notification | null> {
    await this.novuService.markMessageRead(userId, id);
    const list = await this.findByUserId(userId);
    return list.find((n) => n.id === id) ?? null;
  }

  async markAllAsRead(userId: string): Promise<void> {
    return this.novuService.markAllRead(userId);
  }

  async markMultipleAsRead(userId: string, ids: string[]): Promise<void> {
    return this.novuService.markMessagesRead(userId, ids);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.novuService.getUnreadCount(userId);
  }

  async getInboxContext(userId: string): Promise<NovuInboxContext> {
    const user = await this.usersService.findById(userId);
    if (!user?.email) {
      throw new BadRequestException('User email not found');
    }

    await this.novuService.upsertSubscriber(
      user.id,
      user.email,
      user.email.split('@')[0],
    );

    return this.novuService.getInboxContext(user.id);
  }

  deleteByUserId(userId: string): Promise<void> {
    return Promise.reject(
      new BadRequestException(
        `Delete all notifications for user (${userId}) is not supported in Novu-only mode`,
      ),
    );
  }
}
