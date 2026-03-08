/**
 * ExamAttempt domain interface.
 * Created when a student submits answers for an Exam.
 * Grading is performed synchronously at submission time.
 */

export interface ExamQuestionAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  timeSpentMs?: number;
}

export interface ExamAttempt {
  id: string;

  /** The student who took the exam */
  userId: string;

  /** The exam that was attempted */
  examId: string;

  /** Graded answers — one entry per submitted question */
  answers: ExamQuestionAnswer[];

  /** Percentage score 0–100 */
  score: number;

  /** Total questions in the exam at time of submission */
  totalQuestions: number;

  /** Count of correctly answered questions */
  correctAnswers: number;

  /** Total wall-clock time the student spent (ms) */
  totalTimeSpentMs: number;

  /** Whether the student passed (score >= exam.passingScore) */
  passed: boolean;

  /** Lifecycle status */
  status: 'submitted' | 'graded';

  submittedAt: Date;
  gradedAt?: Date | null;

  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
