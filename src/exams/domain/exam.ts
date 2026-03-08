/**
 * Exam domain interface — represents a curated set of questions with a time limit.
 * Used for the "Luồng Thi Thử" (Practice Exam Flow).
 *
 * NOTE: `questionIds` stores the ordered list of question IDs assigned to this exam.
 * `totalQuestions` is a denormalized count derived from `questionIds.length`.
 */
export interface Exam {
  id: string;

  /** Display title shown to students */
  title: string;

  /** Optional rich-text description / instructions */
  description?: string | null;

  /** Ordered list of question IDs included in this exam */
  questionIds: string[];

  /** Denormalized count — kept in sync with questionIds.length */
  totalQuestions: number;

  /** Duration of the exam in seconds (frontend countdown) */
  timeLimitSeconds: number;

  /** Minimum score (0-100) required to pass. Default 50. */
  passingScore: number;

  /** Whether the exam is visible to students */
  isPublished: boolean;

  /** userId of the teacher / admin who created the exam */
  createdBy: string;

  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
