import { ExamAttempt } from '../../../../domain/exam-attempt';

export abstract class ExamAttemptRepositoryAbstract {
  abstract findById(id: string): Promise<ExamAttempt | null>;
  abstract create(data: Partial<ExamAttempt>): Promise<ExamAttempt>;
  abstract findByUserId(userId: string): Promise<ExamAttempt[]>;
  abstract findByExamId(examId: string): Promise<ExamAttempt[]>;
  abstract findByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempt[]>;
  abstract findBestAttemptByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempt | null>;
  abstract softDelete(id: string): Promise<void>;
}
