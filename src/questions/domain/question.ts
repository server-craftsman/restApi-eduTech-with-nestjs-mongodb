import { QuestionType, Difficulty } from '../../enums';

/**
 * Question domain interface
 * Represents quiz/assessment questions
 */
export interface Question {
  id: string;
  lessonId?: string;
  quizId?: string;
  contentHtml: string;
  type: QuestionType;
  difficulty: Difficulty;
  options: string[]; // JSON array of option strings
  correctAnswer: string; // Index or value depending on question type
  explanation: string;
  tags?: string[]; // Topic tags for filtering
  points?: number; // Points awarded for correct answer
  // Soft-delete fields
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
