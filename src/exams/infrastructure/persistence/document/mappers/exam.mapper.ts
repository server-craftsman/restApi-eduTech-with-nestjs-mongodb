import { Injectable } from '@nestjs/common';
import { Exam } from '../../../../domain/exam';
import { ExamDocument, ExamDocumentType } from '../schemas/exam.schema';

@Injectable()
export class ExamMapper {
  toDomain(doc: ExamDocumentType): Exam {
    return {
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description ?? null,
      questionIds: (doc.questionIds ?? []).map((id) => id.toString()),
      totalQuestions: doc.totalQuestions,
      timeLimitSeconds: doc.timeLimitSeconds,
      passingScore: doc.passingScore,
      isPublished: doc.isPublished,
      createdBy: doc.createdBy.toString(),
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: ExamDocumentType[]): Exam[] {
    return docs.map((d) => this.toDomain(d));
  }

  toDocument(exam: Partial<Exam>): Partial<ExamDocument> {
    const doc: Record<string, unknown> = {};
    if (exam.title !== undefined) doc.title = exam.title;
    if (exam.description !== undefined) doc.description = exam.description;
    if (exam.totalQuestions !== undefined)
      doc.totalQuestions = exam.totalQuestions;
    if (exam.timeLimitSeconds !== undefined)
      doc.timeLimitSeconds = exam.timeLimitSeconds;
    if (exam.passingScore !== undefined) doc.passingScore = exam.passingScore;
    if (exam.isPublished !== undefined) doc.isPublished = exam.isPublished;
    if (exam.isDeleted !== undefined) doc.isDeleted = exam.isDeleted;
    if (exam.deletedAt !== undefined) doc.deletedAt = exam.deletedAt;
    // questionIds and createdBy are handled explicitly in the repository
    return doc as Partial<ExamDocument>;
  }
}
