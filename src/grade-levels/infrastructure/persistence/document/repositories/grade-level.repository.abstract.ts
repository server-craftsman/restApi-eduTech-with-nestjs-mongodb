import { GradeLevel } from '../../../../domain/grade-level';

export abstract class GradeLevelRepositoryAbstract {
  abstract findById(id: string): Promise<GradeLevel | null>;
  abstract findAll(): Promise<GradeLevel[]>;
  abstract create(
    data: Omit<GradeLevel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<GradeLevel>;
  abstract update(
    id: string,
    data: Partial<GradeLevel>,
  ): Promise<GradeLevel | null>;
  abstract delete(id: string): Promise<void>;
  abstract findByValue(value: number): Promise<GradeLevel | null>;
  abstract findByName(name: string): Promise<GradeLevel | null>;
}
