import { Injectable } from '@nestjs/common';
import { Question } from '../../../../domain/question';
import {
  QuestionDocumentType,
  QuestionDocument,
} from '../schemas/question.schema';
import { QuestionType, Difficulty } from '../../../../../enums';

@Injectable()
export class QuestionMapper {
  toDomain(doc: QuestionDocumentType): Question {
    return {
      id: doc._id.toString(),
      lessonId: doc.lessonId.toString(),
      contentHtml: doc.contentHtml,
      type: (doc.type as QuestionType) || QuestionType.MultipleChoice,
      difficulty: (doc.difficulty as Difficulty) || Difficulty.Medium,
      options: doc.options,
      correctAnswer: doc.correctAnswer,
      explanation: doc.explanation,
      tags: doc.tags ?? [],
      points: doc.points ?? 10,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: QuestionDocumentType[]): Question[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(question: Partial<Question>): Partial<QuestionDocument> {
    const doc: Record<string, unknown> = {};
    if (question.lessonId !== undefined) doc.lessonId = question.lessonId;
    if (question.contentHtml !== undefined)
      doc.contentHtml = question.contentHtml;
    if (question.type !== undefined) doc.type = question.type;
    if (question.difficulty !== undefined) doc.difficulty = question.difficulty;
    if (question.options !== undefined) doc.options = question.options;
    if (question.correctAnswer !== undefined)
      doc.correctAnswer = question.correctAnswer;
    if (question.explanation !== undefined)
      doc.explanation = question.explanation;
    if (question.tags !== undefined) doc.tags = question.tags;
    if (question.points !== undefined) doc.points = question.points;
    if (question.isDeleted !== undefined) doc.isDeleted = question.isDeleted;
    if (question.deletedAt !== undefined) doc.deletedAt = question.deletedAt;
    return doc as Partial<QuestionDocument>;
  }
}
