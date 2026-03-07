import { Lesson } from '../../../../domain/lesson';

export abstract class LessonRepositoryAbstract {
  abstract findById(id: string): Promise<Lesson | null>;
  abstract findAll(): Promise<Lesson[]>;
  abstract create(
    data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Lesson>;
  abstract update(id: string, data: Partial<Lesson>): Promise<Lesson | null>;
  abstract softDelete(id: string): Promise<void>;
  abstract findByChapterId(chapterId: string): Promise<Lesson[]>;
  abstract findByChapterIdOrdered(chapterId: string): Promise<Lesson[]>;
  abstract findByCourseId(courseId: string): Promise<Lesson[]>;
  abstract findPreviousLesson(lessonId: string): Promise<Lesson | null>;
  /** Full-text search on title, description, contentMd (case-insensitive regex) */
  abstract searchByKeyword(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<[Lesson[], number]>;
}
