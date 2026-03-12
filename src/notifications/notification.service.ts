import { Injectable } from '@nestjs/common';
import { NotificationRepositoryAbstract } from './infrastructure/persistence/document/repositories/notification.repository.abstract';
import { Notification } from './domain/notification';
import { NotificationType } from '../enums';
import { BaseService } from '../core/base/base.service';

@Injectable()
export class NotificationService extends BaseService {
  constructor(
    private readonly notificationRepository: NotificationRepositoryAbstract,
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
    return this.notificationRepository.create(data);
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findById(id);
  }

  async getAllNotifications(): Promise<Notification[]> {
    return this.notificationRepository.findAll();
  }

  async deleteNotification(id: string): Promise<void> {
    return this.notificationRepository.delete(id);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId);
  }

  async findByUserIdAndType(
    userId: string,
    type: NotificationType,
  ): Promise<Notification[]> {
    return this.notificationRepository.findByUserIdAndType(userId, type);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async markMultipleAsRead(ids: string[]): Promise<void> {
    return this.notificationRepository.markMultipleAsRead(ids);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    return this.notificationRepository.deleteByUserId(userId);
  }
}
