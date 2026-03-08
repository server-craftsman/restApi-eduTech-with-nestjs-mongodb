import { WrongAnswer } from '../../../../domain/wrong-answer';

/**
 * Abstract repository contract for the wrong-answer bank.
 * All implementations must extend this class.
 */
export abstract class WrongAnswerRepositoryAbstract {
  /** Find a single record by its MongoDB _id */
  abstract findById(id: string): Promise<WrongAnswer | null>;

  /**
   * Return all (non-deleted) wrong-answer records for a user.
   * Pass `isMastered = false` (default) to get only unresolved items.
   * Pass `isMastered = true` to get mastered items.
   * Omit / pass `undefined` to get all items regardless of mastery.
   */
  abstract findByUserId(
    userId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswer[]>;

  /**
   * Return wrong-answer records for a user filtered by lesson.
   */
  abstract findByUserIdAndLessonId(
    userId: string,
    lessonId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswer[]>;

  /**
   * Return the single wrong-answer record for a specific (user, question) pair.
   */
  abstract findByUserIdAndQuestionId(
    userId: string,
    questionId: string,
  ): Promise<WrongAnswer | null>;

  /**
   * Upsert a wrong-answer record:
   *  - If a record already exists for this (userId, questionId): increment failCount,
   *    update lastFailedAt, reset isMastered to false (in case it was previously mastered).
   *  - If no record exists: create one with failCount = 1.
   */
  abstract upsertWrongAnswer(
    userId: string,
    questionId: string,
    lessonId: string,
  ): Promise<WrongAnswer>;

  /**
   * Mark a (userId, questionId) pair as mastered.
   * Only updates if the record exists and is not already mastered.
   * Returns the updated document or null when not found.
   */
  abstract markMastered(
    userId: string,
    questionId: string,
  ): Promise<WrongAnswer | null>;

  /** Soft-delete a record by its _id */
  abstract softDelete(id: string): Promise<void>;

  /**
   * Aggregate stats for a user's wrong-answer bank.
   */
  abstract getStats(userId: string): Promise<{
    total: number;
    mastered: number;
    remaining: number;
  }>;
}
