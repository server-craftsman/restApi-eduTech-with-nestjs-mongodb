/**
 * Individual answer within a quiz attempt
 */
export interface QuestionAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  timeSpentMs?: number;
}

/**
 * Quiz Attempt domain model
 * Represents a student's submission of a quiz attempt
 */
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  lessonId?: string;
  /** Array of answers for each question in the quiz */
  answers: QuestionAnswer[];
  /** Percentage score (0-100) */
  score: number;
  /** Total questions in the quiz */
  totalQuestions: number;
  /** Number of correct answers */
  correctAnswers: number;
  /** Total time spent on quiz in milliseconds */
  totalTimeSpentMs: number;
  /** Status of the attempt: submitted, graded, in-progress */
  status: 'submitted' | 'graded' | 'in-progress';
  /** When the attempt was submitted */
  submittedAt: Date;
  /** When the attempt was graded */
  gradedAt?: Date | null;
  /** Soft delete flag */
  isDeleted: boolean;
  /** When the record was soft-deleted */
  deletedAt?: Date | null;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}
