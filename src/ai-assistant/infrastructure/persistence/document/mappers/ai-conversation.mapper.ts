import { Injectable } from '@nestjs/common';
import { AiConversation, AiMessage } from '../../../../domain/ai-conversation';
import {
  AiConversationDocument,
  AiConversationDocumentType,
  AiMessageSubDoc,
} from '../schemas/ai-conversation.schema';
import { AiMessageRole } from '../../../../../enums';

@Injectable()
export class AiConversationMapper {
  toDomain(doc: AiConversationDocumentType): AiConversation {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      title: doc.title,
      subject: doc.subject ?? null,
      messages: (doc.messages ?? []).map((m) => this.messageToPlain(m)),
      totalTokensUsed: doc.totalTokensUsed ?? 0,
      lastModel: doc.lastModel ?? null,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: AiConversationDocumentType[]): AiConversation[] {
    return docs.map((d) => this.toDomain(d));
  }

  toDocument(conv: Partial<AiConversation>): Partial<AiConversationDocument> {
    const doc: Record<string, unknown> = {};
    if (conv.userId !== undefined) doc.userId = conv.userId;
    if (conv.title !== undefined) doc.title = conv.title;
    if (conv.subject !== undefined) doc.subject = conv.subject;
    if (conv.messages !== undefined) doc.messages = conv.messages;
    if (conv.totalTokensUsed !== undefined)
      doc.totalTokensUsed = conv.totalTokensUsed;
    if (conv.lastModel !== undefined) doc.lastModel = conv.lastModel;
    if (conv.isDeleted !== undefined) doc.isDeleted = conv.isDeleted;
    if (conv.deletedAt !== undefined) doc.deletedAt = conv.deletedAt;
    return doc as Partial<AiConversationDocument>;
  }

  private messageToPlain(m: AiMessageSubDoc): AiMessage {
    return {
      role: m.role ?? AiMessageRole.User,
      content: m.content,
      timestamp: m.timestamp,
    };
  }
}
