import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LessonRepositoryAbstract } from './infrastructure/persistence/document/repositories/lesson.repository.abstract';
import { Lesson } from './domain/lesson';
import {
  CreateLessonDto,
  UpdateLessonDto,
  QueryLessonDto,
  SortLessonDto,
} from './dto';
import { ChapterRepositoryAbstract } from '../chapters/infrastructure/persistence/document/repositories/chapter.repository.abstract';
import { CourseRepositoryAbstract } from '../courses/infrastructure/persistence/document/repositories/course.repository.abstract';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../core/cache';

/**
 * Service for managing lessons
 * Handles business logic for lesson CRUD operations, validation, and relationships
 */
@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepository: LessonRepositoryAbstract,
    private readonly chapterRepository: ChapterRepositoryAbstract,
    private readonly courseRepository: CourseRepositoryAbstract,
    private readonly cacheService: CacheService,
  ) {}

  private async invalidateLessonCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern(CACHE_KEYS.LESSON),
      this.cacheService.invalidatePattern(CACHE_KEYS.LESSONS_ALL),
      this.cacheService.invalidatePattern(CACHE_KEYS.LESSONS_BY_CHAPTER),
      this.cacheService.invalidatePattern(CACHE_KEYS.CHAPTER),
      this.cacheService.invalidatePattern(CACHE_KEYS.CHAPTERS_BY_COURSE),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE_CHAPTERS),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE_LESSONS),
      this.cacheService.invalidatePattern(CACHE_KEYS.SEARCH),
    ]);
  }

  /**
   * Create a new lesson
   * @param dto - Lesson creation data
   * @returns Created lesson
   * @throws BadRequestException if validation fails
   */
  async createLesson(dto: CreateLessonDto): Promise<Lesson> {
    if (!dto.video || !dto.video.url || dto.video.url.trim().length === 0) {
      throw new BadRequestException(
        'Video URL is required and cannot be empty',
      );
    }

    if (!dto.video.durationSeconds || dto.video.durationSeconds < 1) {
      throw new BadRequestException(
        'video.durationSeconds is required. ' +
          'Upload the video via POST /uploads first — the response includes ' +
          'durationSeconds which you should copy into the video object.',
      );
    }

    if (dto.title.trim().length < 3) {
      throw new BadRequestException('Title must be at least 3 characters long');
    }

    const lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> = {
      chapterId: dto.chapterId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      orderIndex: dto.orderIndex,
      video: {
        url: dto.video.url,
        fileSize: dto.video.fileSize,
        publicId: dto.video.publicId,
        durationSeconds: dto.video.durationSeconds,
      },
      contentMd: dto.contentMd,
      isPreview: dto.isPreview ?? false,
      isDeleted: false,
      deletedAt: null,
    };

    const created = await this.lessonRepository.create(lessonData);
    await this.invalidateLessonCaches();
    return created;
  }

  /**
   * Get lesson by ID (excluding soft-deleted)
   * @param id - Lesson ID
   * @returns Lesson or null if not found
   */
  async getLessonById(id: string): Promise<Lesson | null> {
    return this.cacheService.getOrFetch(
      `${CACHE_KEYS.LESSON}${id}`,
      () => this.lessonRepository.findById(id),
      CACHE_TTL.LESSONS,
    );
  }

  /**
   * Alias for getLessonById
   */
  async findById(id: string): Promise<Lesson | null> {
    return this.getLessonById(id);
  }

  /**
   * Get all non-deleted lessons
   * @returns Array of lessons
   */
  async getAllLessons(): Promise<Lesson[]> {
    return this.cacheService.getOrFetch(
      CACHE_KEYS.LESSONS_ALL,
      () => this.lessonRepository.findAll(),
      CACHE_TTL.LESSONS,
    );
  }

  /**
   * Update an existing lesson
   * @param id - Lesson ID
   * @param dto - Partial lesson update data
   * @returns Updated lesson
   * @throws NotFoundException if lesson not found
   */
  async updateLesson(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    // Validate lesson exists
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Validate update constraints
    if (dto.title !== undefined && dto.title.trim().length < 3) {
      throw new BadRequestException('Title must be at least 3 characters long');
    }

    if (
      dto.video !== undefined &&
      (!dto.video.url || dto.video.url.trim().length === 0)
    ) {
      throw new BadRequestException('Video URL cannot be empty');
    }

    const updateData: Partial<Lesson> = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined)
      updateData.description = dto.description.trim();
    if (dto.orderIndex !== undefined) updateData.orderIndex = dto.orderIndex;
    if (dto.video !== undefined)
      updateData.video = {
        url: dto.video.url,
        fileSize: dto.video.fileSize,
        publicId: dto.video.publicId,
        durationSeconds: dto.video.durationSeconds,
      };
    if (dto.contentMd !== undefined) updateData.contentMd = dto.contentMd;
    if (dto.isPreview !== undefined) updateData.isPreview = dto.isPreview;

    const updated = await this.lessonRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Failed to update lesson with ID ${id}`);
    }
    await this.invalidateLessonCaches();
    return updated;
  }

  /**
   * Soft-delete a lesson
   * @param id - Lesson ID
   * @throws NotFoundException if lesson not found
   */
  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    await this.lessonRepository.softDelete(id);
    await this.invalidateLessonCaches();
  }

  /**
   * Get all lessons in a chapter (ordered)
   * @param chapterId - Chapter ID
   * @returns Array of lessons ordered by orderIndex
   */
  async findByChapterId(chapterId: string): Promise<Lesson[]> {
    return this.cacheService.getOrFetch(
      `${CACHE_KEYS.LESSONS_BY_CHAPTER}${chapterId}`,
      () => this.lessonRepository.findByChapterId(chapterId),
      CACHE_TTL.LESSONS,
    );
  }

  /**
   * Get ordered lessons by chapter
   * @param chapterId - Chapter ID
   * @returns Array of lessons sorted by orderIndex
   */
  async findByChapterIdOrdered(chapterId: string): Promise<Lesson[]> {
    return this.lessonRepository.findByChapterIdOrdered(chapterId);
  }

  /**
   * Get all lessons in a course
   * @param courseId - Course ID
   * @returns Array of all lessons in the course
   */
  async findByCourseId(courseId: string): Promise<Lesson[]> {
    return this.lessonRepository.findByCourseId(courseId);
  }

  /**
   * Get previous lesson in chapter sequence
   * @param lessonId - Current lesson ID
   * @returns Previous lesson or null
   */
  async findPreviousLesson(lessonId: string): Promise<Lesson | null> {
    return this.lessonRepository.findPreviousLesson(lessonId);
  }

  /**
   * Get next lesson in chapter sequence
   * @param lessonId - Current lesson ID
   * @returns Next lesson or null
   */
  async findNextLesson(lessonId: string): Promise<Lesson | null> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) return null;

    // Get all lessons in the same chapter ordered
    const lessonsInChapter = await this.findByChapterIdOrdered(
      lesson.chapterId,
    );
    const currentIndex = lessonsInChapter.findIndex((l) => l.id === lessonId);

    if (currentIndex < 0 || currentIndex >= lessonsInChapter.length - 1) {
      return null;
    }

    return lessonsInChapter[currentIndex + 1];
  }

  /**
   * Validate lesson exists
   * @param id - Lesson ID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const lesson = await this.lessonRepository.findById(id);
    return !!lesson;
  }

  /**
   * Count lessons in a chapter
   * @param chapterId - Chapter ID
   * @returns Number of lessons
   */
  async countInChapter(chapterId: string): Promise<number> {
    const lessons = await this.findByChapterId(chapterId);
    return lessons.length;
  }

  async getMyLessons(
    userId: string,
    query: QueryLessonDto,
  ): Promise<{
    lessons: Lesson[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const requestedCourseId = query.filters?.courseId ?? undefined;
    const ownedCourseIds: string[] = requestedCourseId
      ? await (async () => {
      const requestedCourse =
        await this.courseRepository.findByIdNotDeleted(requestedCourseId);
      if (!requestedCourse) {
        throw new NotFoundException('Course not found');
      }
      if (requestedCourse.authorId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to access lessons in this course',
        );
      }
      return [requestedCourseId];
    })()
      : (
          await this.courseRepository.findByAuthorIdNotDeleted(userId)
        ).map((course) => course.id);

    if (ownedCourseIds.length === 0) {
      return { lessons: [], total: 0, page, limit };
    }

    const chapterResults = await Promise.all(
      ownedCourseIds.map((courseId) =>
        this.chapterRepository.findByCourseId(courseId),
      ),
    );
    const chapterIds = chapterResults.flat().map((chapter) => chapter.id);

    if (chapterIds.length === 0) {
      return { lessons: [], total: 0, page, limit };
    }

    const [lessons, total] = await this.lessonRepository.findAllWithFilters(
      limit,
      offset,
      query.filters ?? undefined,
      (query.sort as SortLessonDto[]) ?? [],
      chapterIds,
    );

    return { lessons, total, page, limit };
  }
}
