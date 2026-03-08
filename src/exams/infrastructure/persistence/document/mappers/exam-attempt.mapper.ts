import { Injectable } from '@nestjs/common';
import { ExamAttempt } from '../../../../domain/exam-attempt';
import {
  ExamAttemptDocument,
  ExamAttemptDocumentType,
} from '../schemas/exam-attempt.schema';

@Injectable()
export class ExamAttemptMapper {
  toDomain(doc: ExamAttemptDocumentType): ExamAttempt {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      examId: doc.examId.toString(),
      answers: (doc.answers ?? []).map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        timeSpentMs: a.timeSpentMs,
      })),
      score: doc.score,
      totalQuestions: doc.totalQuestions,
      correctAnswers: doc.correctAnswers,
      totalTimeSpentMs: doc.totalTimeSpentMs,
      passed: doc.passed,
      status: doc.status as 'submitted' | 'graded',
      submittedAt: doc.submittedAt ?? doc.createdAt,
      gradedAt: doc.gradedAt ?? null,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: ExamAttemptDocumentType[]): ExamAttempt[] {
    return docs.map((d) => this.toDomain(d));
  }

  toDocument(attempt: Partial<ExamAttempt>): Partial<ExamAttemptDocument> {
    const doc: Record<string, unknown> = {};
    if (attempt.answers !== undefined) doc.answers = attempt.answers;
    if (attempt.score !== undefined) doc.score = attempt.score;
    if (attempt.totalQuestions !== undefined)
      doc.totalQuestions = attempt.totalQuestions;
    if (attempt.correctAnswers !== undefined)
      doc.correctAnswers = attempt.correctAnswers;
    if (attempt.totalTimeSpentMs !== undefined)
      doc.totalTimeSpentMs = attempt.totalTimeSpentMs;
    if (attempt.passed !== undefined) doc.passed = attempt.passed;
    if (attempt.status !== undefined) doc.status = attempt.status;
    if (attempt.submittedAt !== undefined)
      doc.submittedAt = attempt.submittedAt;
    if (attempt.gradedAt !== undefined) doc.gradedAt = attempt.gradedAt;
    if (attempt.isDeleted !== undefined) doc.isDeleted = attempt.isDeleted;
    if (attempt.deletedAt !== undefined) doc.deletedAt = attempt.deletedAt;
    return doc as Partial<ExamAttemptDocument>;
  }
}
