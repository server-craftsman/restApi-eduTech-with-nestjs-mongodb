import { Chapter } from '../../../../domain/chapter';
import {
  FilterChapterDto,
  SortChapterDto,
} from '../../../../dto/query-chapter.dto';

export abstract class ChapterRepositoryAbstract {
  abstract findById(id: string): Promise<Chapter | null>;
  abstract findAll(): Promise<Chapter[]>;
  abstract findAllWithFilters(
    limit: number,
    offset: number,
    filters?: FilterChapterDto,
    sort?: SortChapterDto[],
  ): Promise<[Chapter[], number]>;
  abstract create(chapter: Partial<Chapter>): Promise<Chapter>;
  abstract update(
    id: string,
    chapter: Partial<Chapter>,
  ): Promise<Chapter | null>;
  abstract softDelete(id: string): Promise<void>;
  abstract findByCourseId(courseId: string): Promise<Chapter[]>;
  abstract reorderChapters(
    courseId: string,
    chapters: Array<{ id: string; orderIndex: number }>,
  ): Promise<Chapter[]>;
  abstract getStatistics(): Promise<{
    total: number;
    published: number;
    draft: number;
    deleted: number;
    byPublished: Record<string, number>;
  }>;
}
