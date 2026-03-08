/**
 * WrongAnswer domain model.
 *
 * One record per (userId, questionId) pair — upserted every time a student
 * answers a question incorrectly.  When the student finally gets it right
 * (either in a regular quiz or in a practice session) `isMastered` is set
 * to `true`.
 */
export interface WrongAnswer {
  id: string;
  /** Student's user ID */
  userId: string;
  /** The question that was answered incorrectly */
  questionId: string;
  /** Lesson the question belongs to — for grouping/filtering */
  lessonId: string;
  /** How many times the student answered this question wrong */
  failCount: number;
  /** Timestamp of the most recent wrong answer */
  lastFailedAt: Date;
  /** True once the student answers this question correctly */
  isMastered: boolean;
  /** Timestamp when isMastered became true */
  masteredAt?: Date | null;
  // ── Soft-delete ──
  isDeleted: boolean;
  deletedAt?: Date | null;
  // ── Timestamps ──
  createdAt: Date;
  updatedAt: Date;
}
