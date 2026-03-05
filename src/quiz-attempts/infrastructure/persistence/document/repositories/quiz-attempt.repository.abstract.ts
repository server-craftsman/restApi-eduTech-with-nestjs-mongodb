import { QuizAttempt } from '../../../../domain/quiz-attempt';

export abstract class QuizAttemptRepositoryAbstract {
  abstract findById(id: string): Promise<QuizAttempt | null>;
  abstract findAll(): Promise<QuizAttempt[]>;
  abstract create(
    data: Omit<QuizAttempt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<QuizAttempt>;
  abstract update(id: string, data: Partial<QuizAttempt>): Promise<QuizAttempt>;
  abstract delete(id: string): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
  abstract findByUserId(userId: string): Promise<QuizAttempt[]>;
  abstract findByQuizId(quizId: string): Promise<QuizAttempt[]>;
  abstract findByQuestionId(questionId: string): Promise<QuizAttempt[]>;
  abstract findByUserAndQuestion(
    userId: string,
    questionId: string,
  ): Promise<QuizAttempt[]>;
  abstract findByUserAndQuiz(
    userId: string,
    quizId: string,
  ): Promise<QuizAttempt[]>;
  abstract findBestAttemptByUserAndQuiz(
    userId: string,
    quizId: string,
  ): Promise<QuizAttempt | null>;
  abstract getAttemptStats(userId: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: string | number;
    averageTimeSpentMs: number;
    totalTimeSpentMs: number;
  }>;
}
