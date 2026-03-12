import { Notification } from '../../../../domain/notification';
import { NotificationType } from '../../../../../enums';

export abstract class NotificationRepositoryAbstract {
  abstract findById(id: string): Promise<Notification | null>;
  abstract findAll(): Promise<Notification[]>;
  abstract create(
    data: Omit<Notification, 'id' | 'createdAt'>,
  ): Promise<Notification>;
  abstract delete(id: string): Promise<void>;
  abstract findByUserId(userId: string): Promise<Notification[]>;
  abstract findByUserIdAndType(
    userId: string,
    type: NotificationType,
  ): Promise<Notification[]>;
  abstract markAsRead(id: string): Promise<Notification | null>;
  abstract markAllAsRead(userId: string): Promise<void>;
  abstract markMultipleAsRead(ids: string[]): Promise<void>;
  abstract getUnreadCount(userId: string): Promise<number>;
  abstract deleteByUserId(userId: string): Promise<void>;
}
