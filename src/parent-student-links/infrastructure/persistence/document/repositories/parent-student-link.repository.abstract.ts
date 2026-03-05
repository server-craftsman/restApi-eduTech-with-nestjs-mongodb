import { ParentStudentLink } from '../../../../domain/parent-student-link';

export abstract class ParentStudentLinkRepositoryAbstract {
  abstract findById(id: string): Promise<ParentStudentLink | null>;
  abstract findAll(): Promise<ParentStudentLink[]>;
  abstract create(
    data: Omit<ParentStudentLink, 'id' | 'createdAt'>,
  ): Promise<ParentStudentLink>;
  abstract update(
    id: string,
    data: Partial<ParentStudentLink>,
  ): Promise<ParentStudentLink | null>;
  abstract delete(id: string): Promise<void>;
  abstract findByParentId(parentId: string): Promise<ParentStudentLink[]>;
  abstract findByStudentId(studentId: string): Promise<ParentStudentLink[]>;
  abstract findByParentAndStudent(
    parentId: string,
    studentId: string,
  ): Promise<ParentStudentLink | null>;
  abstract findVerifiedByParentId(
    parentId: string,
  ): Promise<ParentStudentLink[]>;
  abstract findVerifiedByStudentId(
    studentId: string,
  ): Promise<ParentStudentLink[]>;
  abstract findByLinkCode(code: string): Promise<ParentStudentLink | null>;
  abstract findPendingByStudentId(
    studentId: string,
  ): Promise<ParentStudentLink | null>;
  /** Returns all verified links — used by the weekly/monthly cron reporter. */
  abstract findAllVerified(): Promise<ParentStudentLink[]>;
}
