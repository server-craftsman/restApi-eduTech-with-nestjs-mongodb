import { Injectable } from '@nestjs/common';
import { UserRole, CourseStatus } from '../enums';
import { Lesson } from '../lessons/domain/lesson';
import { Material } from '../materials/domain/material';
import { Course } from '../courses/domain/course';
import { Chapter } from '../chapters/domain/chapter';
import { Subject } from '../subjects/domain/subject';
import { Exam } from '../exams/domain/exam';
import { LessonRepositoryAbstract } from '../lessons/infrastructure/persistence/document/repositories/lesson.repository.abstract';
import { MaterialRepositoryAbstract } from '../materials/infrastructure/persistence/document/repositories/material.repository.abstract';
import { CourseRepositoryAbstract } from '../courses/infrastructure/persistence/document/repositories/course.repository.abstract';
import { ChapterRepositoryAbstract } from '../chapters/infrastructure/persistence/document/repositories/chapter.repository.abstract';
import { ExamRepositoryAbstract } from '../exams/infrastructure/persistence/document/repositories/exam.repository.abstract';
import { SubjectService } from '../subjects/subject.service';
import { normalizeVietnameseText } from '../core/constants';
import {
  ChapterSearchResultDto,
  CourseSearchResultDto,
  ExamSearchResultDto,
  LessonSearchResultDto,
  MaterialSearchResultDto,
  SearchCountByTypeDto,
  SearchMetaDto,
  SearchMixedItemDto,
  SubjectSearchResultDto,
  SearchResultDto,
} from './dto/search-result.dto';
import { SearchQueryDto, SearchSortBy, SearchType } from './dto/search-query.dto';
import { UploadUrlDto } from '../uploads/dto';

type SearchEntityType = Exclude<SearchType, SearchType.All>;

type SearchBucket = {
  lessons: LessonSearchResultDto[];
  materials: MaterialSearchResultDto[];
  courses: CourseSearchResultDto[];
  chapters: ChapterSearchResultDto[];
  subjects: SubjectSearchResultDto[];
  exams: ExamSearchResultDto[];
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PER_TYPE_CAP = 120;

@Injectable()
export class SearchService {
  constructor(
    private readonly lessonRepository: LessonRepositoryAbstract,
    private readonly materialRepository: MaterialRepositoryAbstract,
    private readonly courseRepository: CourseRepositoryAbstract,
    private readonly chapterRepository: ChapterRepositoryAbstract,
    private readonly examRepository: ExamRepositoryAbstract,
    private readonly subjectService: SubjectService,
  ) {}

  /**
   * Smart Search 2.0
   * - Vietnamese accent-insensitive
   * - Multi-entity (lessons, materials, courses, chapters, subjects, exams)
   * - Relevance scoring + merged ranked list + grouped payload
   */
  async search(
    dto: SearchQueryDto,
    currentUserRole?: UserRole,
  ): Promise<SearchResultDto> {
    const page = dto.page ?? 1;
    const limit = Math.min(Math.max(dto.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const keyword = dto.keyword.trim();
    const normalizedKeyword = normalizeVietnameseText(keyword);
    const sortBy = dto.sortBy ?? SearchSortBy.Relevance;
    const includeDraft = dto.includeDraft === true;

    const targets = this.resolveTargets(dto);
    const perTypeFetchLimit = Math.min(page * limit * 2, PER_TYPE_CAP);

    const bucket: SearchBucket = {
      lessons: [],
      materials: [],
      courses: [],
      chapters: [],
      subjects: [],
      exams: [],
    };

    if (targets.includes(SearchType.Lessons)) {
      const [lessons] = await this.lessonRepository.searchByKeyword(
        keyword,
        1,
        perTypeFetchLimit,
      );
      bucket.lessons = lessons.map((lesson) => this.mapLesson(lesson, normalizedKeyword));
    }

    if (targets.includes(SearchType.Materials)) {
      const [materials] = await this.materialRepository.searchByKeyword(
        keyword,
        1,
        perTypeFetchLimit,
      );
      bucket.materials = materials.map((material) =>
        this.mapMaterial(material, normalizedKeyword),
      );
    }

    if (targets.includes(SearchType.Courses)) {
      const [courses] = await this.courseRepository.findAllWithFilters(
        perTypeFetchLimit,
        0,
        {
          search: keyword,
          status:
            includeDraft || currentUserRole === UserRole.Admin
              ? null
              : CourseStatus.Published,
        },
      );

      bucket.courses = courses.map((course) => this.mapCourse(course, normalizedKeyword));
    }

    if (targets.includes(SearchType.Chapters)) {
      const [chapters] = await this.chapterRepository.findAllWithFilters(
        perTypeFetchLimit,
        0,
        {
          title: keyword,
          isPublished:
            includeDraft || currentUserRole === UserRole.Admin
              ? null
              : true,
        },
      );

      bucket.chapters = chapters.map((chapter) => this.mapChapter(chapter, normalizedKeyword));
    }

    if (targets.includes(SearchType.Subjects)) {
      const { subjects } = await this.subjectService.getAllSubjectsWithFilter({
        page: 1,
        limit: perTypeFetchLimit,
        filters: { name: keyword },
      });
      bucket.subjects = subjects.map((subject) =>
        this.mapSubject(subject, normalizedKeyword),
      );
    }

    if (targets.includes(SearchType.Exams)) {
      const [exams] = await this.examRepository.findAllWithFilters(
        perTypeFetchLimit,
        0,
        {
          title: keyword,
          isPublished:
            includeDraft || currentUserRole === UserRole.Admin
              ? null
              : true,
        },
      );
      bucket.exams = exams.map((exam) => this.mapExam(exam, normalizedKeyword));
    }

    const merged = this.mergeAndSort(bucket, sortBy);
    const total = merged.length;
    const offset = (page - 1) * limit;
    const pagedItems = merged.slice(offset, offset + limit);

    const meta: SearchMetaDto = {
      normalizedKeyword,
      page,
      limit,
      total,
      countByType: this.buildCountByType(bucket),
      hasNextPage: offset + limit < total,
    };

    const grouped: SearchResultDto['grouped'] = {
      lessons: bucket.lessons,
      materials: bucket.materials,
      courses: bucket.courses,
      chapters: bucket.chapters,
      subjects: bucket.subjects,
      exams: bucket.exams,
    };

    return {
      keyword,
      items: pagedItems,
      grouped,
      meta,
      // legacy fields
      lessons: bucket.lessons,
      materials: bucket.materials,
      totalLessons: bucket.lessons.length,
      totalMaterials: bucket.materials.length,
      total,
      page,
      limit,
    };
  }

  private resolveTargets(dto: SearchQueryDto): SearchEntityType[] {
    const explicit = dto.types?.filter(
      (t): t is SearchEntityType => t !== SearchType.All,
    );

    if (explicit?.length) return Array.from(new Set(explicit));

    const single = dto.type ?? SearchType.All;
    if (single !== SearchType.All) return [single as SearchEntityType];

    return [
      SearchType.Lessons,
      SearchType.Materials,
      SearchType.Courses,
      SearchType.Chapters,
      SearchType.Subjects,
      SearchType.Exams,
    ];
  }

  private mapLesson(lesson: Lesson, normalizedKeyword: string): LessonSearchResultDto {
    const score = this.computeScore(normalizedKeyword, [
      lesson.title,
      lesson.description,
      lesson.contentMd,
    ]);

    return {
      id: lesson.id,
      chapterId: lesson.chapterId,
      title: lesson.title,
      description: lesson.description,
      video: {
        url: lesson.video.url,
        fileSize: lesson.video.fileSize,
        publicId: lesson.video.publicId,
        durationSeconds: lesson.video.durationSeconds,
      } as UploadUrlDto,
      contentMd: lesson.contentMd,
      isPreview: lesson.isPreview,
      orderIndex: lesson.orderIndex,
      createdAt: lesson.createdAt,
      score,
    };
  }

  private mapMaterial(
    material: Material,
    normalizedKeyword: string,
  ): MaterialSearchResultDto {
    const score = this.computeScore(normalizedKeyword, [
      material.title,
      material.description ?? '',
      material.type,
    ]);

    return {
      id: material.id,
      lessonId: material.lessonId,
      title: material.title,
      file: {
        url: material.file.url,
        fileSize: material.file.fileSize,
        publicId: material.file.publicId,
      } as UploadUrlDto,
      type: material.type,
      createdAt: material.createdAt,
      score,
    };
  }

  private mapCourse(course: Course, normalizedKeyword: string): CourseSearchResultDto {
    const score = this.computeScore(normalizedKeyword, [
      course.title,
      course.description,
    ]);

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      createdAt: course.createdAt,
      score,
    };
  }

  private mapChapter(
    chapter: Chapter,
    normalizedKeyword: string,
  ): ChapterSearchResultDto {
    const score = this.computeScore(normalizedKeyword, [
      chapter.title,
      chapter.description ?? '',
    ]);

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description ?? null,
      courseId: chapter.courseId,
      orderIndex: chapter.orderIndex,
      isPublished: chapter.isPublished,
      createdAt: chapter.createdAt,
      score,
    };
  }

  private mapSubject(
    subject: Subject,
    normalizedKeyword: string,
  ): SubjectSearchResultDto {
    const score = this.computeScore(normalizedKeyword, [subject.name, subject.slug]);

    return {
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      createdAt: subject.createdAt,
      score,
    };
  }

  private mapExam(exam: Exam, normalizedKeyword: string): ExamSearchResultDto {
    const score = this.computeScore(normalizedKeyword, [
      exam.title,
      exam.description ?? '',
    ]);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description ?? null,
      isPublished: exam.isPublished,
      scope: exam.scope,
      createdAt: exam.createdAt,
      score,
    };
  }

  private computeScore(keyword: string, fields: string[]): number {
    let score = 0;
    for (const [index, rawField] of fields.entries()) {
      const field = normalizeVietnameseText(rawField ?? '');
      if (!field) continue;

      const weight = index === 0 ? 1 : 0.65;

      if (field === keyword) {
        score += 100 * weight;
        continue;
      }

      if (field.startsWith(keyword)) {
        score += 80 * weight;
      } else if (field.includes(keyword)) {
        score += 55 * weight;
      }
    }

    return Math.round(score);
  }

  private mergeAndSort(
    bucket: SearchBucket,
    sortBy: SearchSortBy,
  ): SearchMixedItemDto[] {
    const mixed: SearchMixedItemDto[] = [
      ...bucket.lessons.map((item) =>
        this.toMixed(SearchType.Lessons, item.id, item.title, item.description, item.score, item.createdAt),
      ),
      ...bucket.materials.map((item) =>
        this.toMixed(SearchType.Materials, item.id, item.title, item.type, item.score, item.createdAt),
      ),
      ...bucket.courses.map((item) =>
        this.toMixed(SearchType.Courses, item.id, item.title, item.description, item.score, item.createdAt),
      ),
      ...bucket.chapters.map((item) =>
        this.toMixed(SearchType.Chapters, item.id, item.title, item.description ?? null, item.score, item.createdAt),
      ),
      ...bucket.subjects.map((item) =>
        this.toMixed(SearchType.Subjects, item.id, item.name, item.slug, item.score, item.createdAt),
      ),
      ...bucket.exams.map((item) =>
        this.toMixed(SearchType.Exams, item.id, item.title, item.description ?? null, item.score, item.createdAt),
      ),
    ];

    switch (sortBy) {
      case SearchSortBy.Newest:
        return mixed.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.score - a.score,
        );
      case SearchSortBy.Oldest:
        return mixed.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || b.score - a.score,
        );
      case SearchSortBy.Alphabetical:
        return mixed.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      case SearchSortBy.Relevance:
      default:
        return mixed.sort(
          (a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime(),
        );
    }
  }

  private toMixed(
    type: SearchType,
    id: string,
    title: string,
    snippet: string | null | undefined,
    score: number,
    createdAt: Date,
  ): SearchMixedItemDto {
    return {
      type,
      id,
      title,
      snippet: snippet ?? null,
      score,
      createdAt,
    };
  }

  private buildCountByType(bucket: SearchBucket): SearchCountByTypeDto {
    return {
      lessons: bucket.lessons.length,
      materials: bucket.materials.length,
      courses: bucket.courses.length,
      chapters: bucket.chapters.length,
      subjects: bucket.subjects.length,
      exams: bucket.exams.length,
    };
  }
}
