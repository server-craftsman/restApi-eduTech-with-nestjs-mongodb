import { QuizAttempt } from '../../../../domain/quiz-attempt';

export abstract class QuizAttemptRepositoryAbstract {
  abstract findById(id: string): Promise<QuizAttempt | null>;
  abstract findAll(): Promise<QuizAttempt[]>;
  abstract create(
    data: Omit<QuizAttempt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<QuizAttempt>;
  abstract update(id: string, data: Partial<QuizAttempt>): Promise<QuizAttempt>;
  abstract softDelete(id: string): Promise<void>;
  abstract findByUserId(userId: string): Promise<QuizAttempt[]>;
  abstract findByLessonId(lessonId: string): Promise<QuizAttempt[]>;
  abstract findByQuestionId(questionId: string): Promise<QuizAttempt[]>;
  abstract findByUserAndQuestion(
    userId: string,
    questionId: string,
  ): Promise<QuizAttempt[]>;
  abstract findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<QuizAttempt[]>;
  abstract findBestAttemptByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<QuizAttempt | null>;
  abstract getAttemptStats(userId: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: string | number;
    averageTimeSpentMs: number;
    totalTimeSpentMs: number;
  }>;
}
