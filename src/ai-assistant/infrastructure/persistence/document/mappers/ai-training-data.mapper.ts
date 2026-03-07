import { Injectable } from '@nestjs/common';
import { AiTrainingData } from '../../../../domain/ai-training-data';
import {
  AiTrainingDataDocument,
  AiTrainingDataDocumentType,
} from '../schemas/ai-training-data.schema';
import { AiTrainingStatus } from '../../../../../enums';

@Injectable()
export class AiTrainingDataMapper {
  toDomain(doc: AiTrainingDataDocumentType): AiTrainingData {
    return {
      id: doc._id.toString(),
      question: doc.question,
      answer: doc.answer,
      subject: doc.subject ?? null,
      gradeLevel: doc.gradeLevel ?? null,
      tags: doc.tags ?? [],
      status: doc.status ?? AiTrainingStatus.Pending,
      createdBy: doc.createdBy.toString(),
      reviewedBy: doc.reviewedBy?.toString() ?? null,
      reviewedAt: doc.reviewedAt ?? null,
      reviewNote: doc.reviewNote ?? null,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: AiTrainingDataDocumentType[]): AiTrainingData[] {
    return docs.map((d) => this.toDomain(d));
  }

  toDocument(data: Partial<AiTrainingData>): Partial<AiTrainingDataDocument> {
    const doc: Record<string, unknown> = {};
    if (data.question !== undefined) doc.question = data.question;
    if (data.answer !== undefined) doc.answer = data.answer;
    if (data.subject !== undefined) doc.subject = data.subject;
    if (data.gradeLevel !== undefined) doc.gradeLevel = data.gradeLevel;
    if (data.tags !== undefined) doc.tags = data.tags;
    if (data.status !== undefined) doc.status = data.status;
    if (data.createdBy !== undefined) doc.createdBy = data.createdBy;
    if (data.reviewedBy !== undefined) doc.reviewedBy = data.reviewedBy;
    if (data.reviewedAt !== undefined) doc.reviewedAt = data.reviewedAt;
    if (data.reviewNote !== undefined) doc.reviewNote = data.reviewNote;
    if (data.isDeleted !== undefined) doc.isDeleted = data.isDeleted;
    if (data.deletedAt !== undefined) doc.deletedAt = data.deletedAt;
    return doc as Partial<AiTrainingDataDocument>;
  }
}
