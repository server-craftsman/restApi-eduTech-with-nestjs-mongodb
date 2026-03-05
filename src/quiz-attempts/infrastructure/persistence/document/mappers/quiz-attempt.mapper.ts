import { Injectable } from '@nestjs/common';
import { QuizAttempt } from '../../../../domain/quiz-attempt';
import {
  QuizAttemptDocumentType,
  QuizAttemptDocument,
} from '../schemas/quiz-attempt.schema';

@Injectable()
export class QuizAttemptMapper {
  toDomain(doc: QuizAttemptDocumentType): QuizAttempt {
    const status: 'submitted' | 'graded' | 'in-progress' =
      (doc.status as 'submitted' | 'graded' | 'in-progress') || 'submitted';

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      quizId: doc.quizId?.toString() || '',
      lessonId: doc.lessonId?.toString(),
      answers: doc.answers ?? [],
      score: doc.score ?? 0,
      totalQuestions: doc.totalQuestions ?? 0,
      correctAnswers: doc.correctAnswers ?? 0,
      totalTimeSpentMs: doc.totalTimeSpentMs ?? 0,
      status,
      submittedAt: doc.submittedAt || doc.createdAt,
      gradedAt: doc.gradedAt ?? null,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: QuizAttemptDocumentType[]): QuizAttempt[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(attempt: Partial<QuizAttempt>): Partial<QuizAttemptDocument> {
    const doc: Record<string, unknown> = {};

    if (attempt.quizId !== undefined) doc.quizId = attempt.quizId;

    if (attempt.lessonId !== undefined) doc.lessonId = attempt.lessonId;

    if (attempt.answers !== undefined) doc.answers = attempt.answers;

    if (attempt.score !== undefined) doc.score = attempt.score;

    if (attempt.totalQuestions !== undefined)
      doc.totalQuestions = attempt.totalQuestions;

    if (attempt.correctAnswers !== undefined)
      doc.correctAnswers = attempt.correctAnswers;

    if (attempt.totalTimeSpentMs !== undefined)
      doc.totalTimeSpentMs = attempt.totalTimeSpentMs;

    if (attempt.status !== undefined) doc.status = attempt.status;

    if (attempt.submittedAt !== undefined)
      doc.submittedAt = attempt.submittedAt;

    if (attempt.gradedAt !== undefined) doc.gradedAt = attempt.gradedAt;

    if (attempt.isDeleted !== undefined) doc.isDeleted = attempt.isDeleted;

    if (attempt.deletedAt !== undefined) doc.deletedAt = attempt.deletedAt;
    return doc as Partial<QuizAttemptDocument>;
  }
}
