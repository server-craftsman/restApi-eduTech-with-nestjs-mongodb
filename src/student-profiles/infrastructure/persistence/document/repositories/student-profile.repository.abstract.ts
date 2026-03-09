import { BadgeType } from '../../../../../enums';
import { StudentProfile } from '../../../../domain/student-profile';

export abstract class StudentProfileRepositoryAbstract {
  abstract findById(id: string): Promise<StudentProfile | null>;
  abstract findAll(): Promise<StudentProfile[]>;
  abstract create(
    data: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StudentProfile>;
  abstract update(
    id: string,
    data: Partial<StudentProfile>,
  ): Promise<StudentProfile | null>;
  abstract delete(id: string): Promise<void>;
  abstract findByUserId(userId: string): Promise<StudentProfile | null>;
  /**
   * Atomically increment totalPoints using $inc (thread-safe).
   * Returns the updated profile (with the new total), or null if not found.
   */
  abstract incrementPoints(
    userId: string,
    points: number,
  ): Promise<StudentProfile | null>;
  /**
   * Atomically append a badge using $addToSet (no duplicates).
   */
  abstract addBadge(userId: string, badge: BadgeType): Promise<void>;
}
