import { Injectable } from '@nestjs/common';
import { Notification } from '../../../../domain/notification';
import {
  NotificationDocument,
  NotificationDocumentType,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationMapper {
  toDomain(doc: NotificationDocumentType): Notification {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      title: doc.title,
      message: doc.message,
      isRead: doc.isRead,
      type: doc.type,
      actionUrl: doc.actionUrl ?? null,
      metadata: doc.metadata ?? null,
      emailSent: doc.emailSent ?? false,
      novuMessageId: doc.novuMessageId ?? null,
      createdAt: doc.createdAt,
    };
  }

  toDomainArray(docs: NotificationDocumentType[]): Notification[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(
    data: Partial<Notification>,
  ): Partial<NotificationDocument> {
    const doc: Record<string, unknown> = {};
    if (data.userId !== undefined) doc.userId = data.userId;
    if (data.title !== undefined) doc.title = data.title;
    if (data.message !== undefined) doc.message = data.message;
    if (data.isRead !== undefined) doc.isRead = data.isRead;
    if (data.type !== undefined) doc.type = data.type;
    if (data.actionUrl !== undefined) doc.actionUrl = data.actionUrl;
    if (data.metadata !== undefined) doc.metadata = data.metadata;
    if (data.emailSent !== undefined) doc.emailSent = data.emailSent;
    if (data.novuMessageId !== undefined)
      doc.novuMessageId = data.novuMessageId;
    return doc as Partial<NotificationDocument>;
  }
}
