import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { WrongAnswer } from '../../../../domain/wrong-answer';
import {
  WrongAnswerDocument,
  WrongAnswerDocumentType,
} from '../schemas/wrong-answer.schema';

@Injectable()
export class WrongAnswerMapper {
  toDomain(doc: WrongAnswerDocumentType): WrongAnswer {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      questionId: doc.questionId.toString(),
      lessonId: doc.lessonId.toString(),
      failCount: doc.failCount ?? 1,
      lastFailedAt: doc.lastFailedAt,
      isMastered: doc.isMastered ?? false,
      masteredAt: doc.masteredAt ?? null,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: WrongAnswerDocumentType[]): WrongAnswer[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  /**
   * Field-by-field mapping — only sets keys that are explicitly present
   * so partial updates never overwrite unrelated fields with undefined.
   */
  toDocument(wa: Partial<WrongAnswer>): Partial<WrongAnswerDocument> {
    const doc: Record<string, unknown> = {};
    if (wa.userId !== undefined) doc.userId = new Types.ObjectId(wa.userId);
    if (wa.questionId !== undefined)
      doc.questionId = new Types.ObjectId(wa.questionId);
    if (wa.lessonId !== undefined)
      doc.lessonId = new Types.ObjectId(wa.lessonId);
    if (wa.failCount !== undefined) doc.failCount = wa.failCount;
    if (wa.lastFailedAt !== undefined) doc.lastFailedAt = wa.lastFailedAt;
    if (wa.isMastered !== undefined) doc.isMastered = wa.isMastered;
    if (wa.masteredAt !== undefined) doc.masteredAt = wa.masteredAt;
    if (wa.isDeleted !== undefined) doc.isDeleted = wa.isDeleted;
    if (wa.deletedAt !== undefined) doc.deletedAt = wa.deletedAt;
    return doc as Partial<WrongAnswerDocument>;
  }
}
