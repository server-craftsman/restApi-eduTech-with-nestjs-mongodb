import { Material } from '../../../../domain/material';

export abstract class MaterialRepositoryAbstract {
  abstract findById(id: string): Promise<Material | null>;
  abstract findAll(): Promise<Material[]>;
  abstract create(
    data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Material>;
  abstract update(
    id: string,
    data: Partial<Material>,
  ): Promise<Material | null>;
  abstract delete(id: string): Promise<void>;
  abstract findByLessonId(lessonId: string): Promise<Material[]>;
  /** Search materials by title (case-insensitive regex) */
  abstract searchByKeyword(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<[Material[], number]>;
}
