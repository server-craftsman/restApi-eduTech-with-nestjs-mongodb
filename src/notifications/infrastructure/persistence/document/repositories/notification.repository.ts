import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationDocument,
  NotificationDocumentType,
} from '../schemas/notification.schema';
import { NotificationRepositoryAbstract } from './notification.repository.abstract';
import { NotificationMapper } from '../mappers/notification.mapper';
import { Notification } from '../../../../domain/notification';
import { NotificationType } from '../../../../../enums';

@Injectable()
export class NotificationRepository implements NotificationRepositoryAbstract {
  constructor(
    @InjectModel(NotificationDocument.name)
    private readonly notificationModel: Model<NotificationDocumentType>,
    private readonly mapper: NotificationMapper,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.notificationModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Notification[]> {
    const docs = await this.notificationModel.find().sort({ createdAt: -1 });
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Notification, 'id' | 'createdAt'>,
  ): Promise<Notification> {
    const doc = await this.notificationModel.create({
      userId: new Types.ObjectId(data.userId),
      title: data.title,
      message: data.message,
      isRead: data.isRead ?? false,
      type: data.type,
      actionUrl: data.actionUrl ?? null,
      metadata: data.metadata ?? null,
      emailSent: data.emailSent ?? false,
      novuMessageId: data.novuMessageId ?? null,
    });
    return this.mapper.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await this.notificationModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const docs = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
    return this.mapper.toDomainArray(docs);
  }

  async findByUserIdAndType(
    userId: string,
    type: NotificationType,
  ): Promise<Notification[]> {
    const docs = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId), type })
      .sort({ createdAt: -1 });
    return this.mapper.toDomainArray(docs);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const doc = await this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }

  async markMultipleAsRead(ids: string[]): Promise<void> {
    await this.notificationModel.updateMany(
      { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }
}
