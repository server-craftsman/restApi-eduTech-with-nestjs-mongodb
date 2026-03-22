import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CourseRepositoryAbstract } from './infrastructure/persistence/document/repositories/course.repository.abstract';
import { ChapterRepositoryAbstract } from '../chapters/infrastructure/persistence/document/repositories/chapter.repository.abstract';
import { LessonRepositoryAbstract } from '../lessons/infrastructure/persistence/document/repositories/lesson.repository.abstract';
import { QuestionRepositoryAbstract } from '../questions/infrastructure/persistence/document/repositories/question.repository.abstract';
import { MaterialRepositoryAbstract } from '../materials/infrastructure/persistence/document/repositories/material.repository.abstract';
import { Course } from './domain/course';
import { GradeLevel, CourseStatus } from '../enums';
import { FilterCourseDto, QueryCourseDto, SortCourseDto } from './dto';
import { BaseService } from '../core/base/base.service';
import { UsersService } from '../users/users.service';
import { NotificationTriggersService } from '../notifications/services';
import { StudentProfileService } from '../student-profiles/student-profile.service';
import { GradeLevelService } from '../grade-levels/grade-level.service';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../core/cache';

interface PersonalizedCoursesResult {
  courses: Course[];
  total: number;
  needsOnboarding: boolean;
  onboardingUrl?: string;
  strategy: string;
}

@Injectable()
export class CourseService extends BaseService {
  constructor(
    private readonly courseRepository: CourseRepositoryAbstract,
    private readonly chapterRepository: ChapterRepositoryAbstract,
    private readonly lessonRepository: LessonRepositoryAbstract,
    private readonly questionRepository: QuestionRepositoryAbstract,
    private readonly materialRepository: MaterialRepositoryAbstract,
    private readonly usersService: UsersService,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly studentProfileService: StudentProfileService,
    private readonly gradeLevelService: GradeLevelService,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  private async invalidateCourseCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSES_ALL),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE_CHAPTERS),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE_LESSONS),
      this.cacheService.invalidatePattern(CACHE_KEYS.CHAPTERS_BY_COURSE),
      this.cacheService.invalidatePattern(CACHE_KEYS.LESSONS_BY_CHAPTER),
      this.cacheService.invalidatePattern(CACHE_KEYS.DASHBOARD_STATS),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSE_STATS),
      this.cacheService.invalidatePattern(CACHE_KEYS.SEARCH),
    ]);
  }

  /**
   * Personalized feed strategy (onboarding-aware):
   * 1) If profile missing or onboarding incomplete => onboarding hint payload.
   * 2) If onboarding complete => blend multiple candidate pools and rank:
   *    - grade + preferred subject (strongest)
   *    - grade only
   *    - preferred subject only
   *    - global published fallback
   *
   * Caller filters like `search` / `type` / `sort` are still respected.
   */
  async getPersonalizedCourses(
    userRole: string,
    userId: string,
    query: QueryCourseDto,
  ): Promise<PersonalizedCoursesResult> {
    // Non-student roles: keep behavior simple, return all published courses.
    if (userRole !== 'STUDENT') {
      const result = await this.findAllWithFilters(query, {
        status: CourseStatus.Published,
      });
      return {
        courses: result.courses,
        total: result.total,
        needsOnboarding: false,
        strategy: 'published-only-non-student',
      };
    }

    const profile = await this.studentProfileService.getProfileByUserId(userId);
    if (!profile || !profile.onboardingCompleted) {
      return {
        courses: [],
        total: 0,
        needsOnboarding: true,
        onboardingUrl: '/student-profiles/onboarding',
        strategy: !profile
          ? 'missing-student-profile'
          : 'onboarding-not-completed',
      };
    }

    const preferredSubjectIds = Array.from(
      new Set(profile.preferredSubjectIds.filter(Boolean)),
    );

    const gradeLevelId = await this.resolveGradeLevelId(profile.gradeLevel);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const candidateLimit = Math.max(60, page * limit * 4);

    const candidateQuery: QueryCourseDto = {
      ...query,
      page: 1,
      limit: candidateLimit,
    };

    const [gradeAndPreferred, gradeOnly, preferredOnly, fallbackPublished] =
      await Promise.all([
        this.fetchByGradeAndPreferred(
          candidateQuery,
          gradeLevelId,
          preferredSubjectIds,
        ),
        gradeLevelId
          ? this.findAllWithFilters(candidateQuery, {
              status: CourseStatus.Published,
              gradeLevelId,
            })
          : Promise.resolve({ courses: [], total: 0 }),
        this.fetchByPreferredOnly(candidateQuery, preferredSubjectIds),
        this.findAllWithFilters(candidateQuery, {
          status: CourseStatus.Published,
        }),
      ]);

    const dedup = new Map<string, Course>();
    const pushCourses = (courses: Course[]): void => {
      for (const course of courses) {
        if (!dedup.has(course.id)) dedup.set(course.id, course);
      }
    };

    // Priority order keeps relevance stable before scoring tie-breakers.
    pushCourses(gradeAndPreferred.courses);
    pushCourses(gradeOnly.courses);
    pushCourses(preferredOnly.courses);
    pushCourses(fallbackPublished.courses);

    const ranked = Array.from(dedup.values()).sort((a, b) => {
      const scoreA = this.computePersonalizationScore(
        a,
        gradeLevelId,
        preferredSubjectIds,
      );
      const scoreB = this.computePersonalizationScore(
        b,
        gradeLevelId,
        preferredSubjectIds,
      );
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const offset = (page - 1) * limit;
    const paged = ranked.slice(offset, offset + limit);

    return {
      courses: paged,
      total: ranked.length,
      needsOnboarding: false,
      strategy: 'ranked-by-onboarding-signals',
    };
  }

  async createCourse(
    data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Course> {
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException(
        'Course title is required and cannot be empty',
      );
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new BadRequestException(
        'Course description is required and cannot be empty',
      );
    }
    if (!data.subjectId) {
      throw new BadRequestException('Subject ID is required');
    }
    if (!data.gradeLevelId) {
      throw new BadRequestException('Grade level ID is required');
    }
    if (!data.type) {
      throw new BadRequestException('Course type is required');
    }

    // Validate thumbnailUrl Cloudinary asset
    if (
      !data.thumbnailUrl ||
      !data.thumbnailUrl.publicId ||
      !data.thumbnailUrl.url
    ) {
      throw new BadRequestException(
        'Thumbnail must contain both publicId and url from Cloudinary upload',
      );
    }

    // Automatically set status to Draft for new courses
    const courseData = {
      ...data,
      status: CourseStatus.Draft,
      isDeleted: false,
      deletedAt: null,
      title: data.title.trim(),
      description: data.description.trim(),
    };
    const created = await this.courseRepository.create(courseData);
    await this.invalidateCourseCaches();
    return created;
  }

  async getCourseById(id: string): Promise<Course | null> {
    return this.courseRepository.findByIdNotDeleted(id);
  }

  async getCourseByIdWithDeleted(id: string): Promise<Course | null> {
    return this.courseRepository.findById(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAllNotDeleted();
  }

  /**
   * Unified paginated, filterable, sortable course listing.
   *
   * `overrides` fields **always win** over caller-supplied `query.filters`
   * so security constraints (e.g. status=Published for public, authorId from
   * JWT for my-courses) cannot be bypassed.
   */
  async findAllWithFilters(
    query: QueryCourseDto,
    overrides: Partial<FilterCourseDto> = {},
  ): Promise<{ courses: Course[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const filters: FilterCourseDto = {
      ...query.filters,
      ...overrides,
    };

    const cachePayload = {
      page,
      limit,
      filters,
      sort: (query.sort as SortCourseDto[]) ?? [],
    };
    const cacheKey = `${CACHE_KEYS.COURSES_ALL}${JSON.stringify(cachePayload)}`;

    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const [courses, total] = await this.courseRepository.findAllWithFilters(
          limit,
          offset,
          filters,
          (query.sort as SortCourseDto[]) ?? [],
        );
        return { courses, total };
      },
      CACHE_TTL.COURSES,
    );
  }

  private async resolveGradeLevelId(
    gradeLevel?: GradeLevel | null,
  ): Promise<string | undefined> {
    if (!gradeLevel) return undefined;
    const value = Number.parseInt(gradeLevel, 10);
    if (Number.isNaN(value)) return undefined;
    const gradeLevelDoc = await this.gradeLevelService.findByValue(value);
    return gradeLevelDoc?.id;
  }

  private async fetchByGradeAndPreferred(
    query: QueryCourseDto,
    gradeLevelId: string | undefined,
    preferredSubjectIds: string[],
  ): Promise<{ courses: Course[]; total: number }> {
    if (!gradeLevelId || preferredSubjectIds.length === 0) {
      return { courses: [], total: 0 };
    }

    const results = await Promise.all(
      preferredSubjectIds.map((subjectId) =>
        this.findAllWithFilters(query, {
          status: CourseStatus.Published,
          gradeLevelId,
          subjectId,
        }),
      ),
    );

    const dedup = new Map<string, Course>();
    for (const result of results) {
      for (const course of result.courses) {
        if (!dedup.has(course.id)) dedup.set(course.id, course);
      }
    }

    return { courses: Array.from(dedup.values()), total: dedup.size };
  }

  private async fetchByPreferredOnly(
    query: QueryCourseDto,
    preferredSubjectIds: string[],
  ): Promise<{ courses: Course[]; total: number }> {
    if (preferredSubjectIds.length === 0) {
      return { courses: [], total: 0 };
    }

    const results = await Promise.all(
      preferredSubjectIds.map((subjectId) =>
        this.findAllWithFilters(query, {
          status: CourseStatus.Published,
          subjectId,
        }),
      ),
    );

    const dedup = new Map<string, Course>();
    for (const result of results) {
      for (const course of result.courses) {
        if (!dedup.has(course.id)) dedup.set(course.id, course);
      }
    }

    return { courses: Array.from(dedup.values()), total: dedup.size };
  }

  private computePersonalizationScore(
    course: Course,
    gradeLevelId: string | undefined,
    preferredSubjectIds: string[],
  ): number {
    let score = 0;
    if (gradeLevelId && course.gradeLevelId === gradeLevelId) score += 70;
    if (preferredSubjectIds.includes(course.subjectId)) score += 50;
    return score;
  }

  async updateCourse(
    id: string,
    data: Partial<Course>,
  ): Promise<Course | null> {
    // Validate the course exists
    const existingCourse = await this.courseRepository.findByIdNotDeleted(id);
    if (!existingCourse) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    // Validate field constraints
    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new BadRequestException('Course title cannot be empty');
      }
      data.title = data.title.trim();
    }

    if (data.description !== undefined) {
      if (data.description.trim().length === 0) {
        throw new BadRequestException('Course description cannot be empty');
      }
      data.description = data.description.trim();
    }

    // Validate thumbnailUrl Cloudinary asset if provided
    if (
      data.thumbnailUrl &&
      (!data.thumbnailUrl.publicId || !data.thumbnailUrl.url)
    ) {
      throw new BadRequestException(
        'Thumbnail must contain both publicId and url from Cloudinary upload',
      );
    }

    // Remove fields that shouldn't be updated directly
    const { ...updateData } = data;
    const updated = await this.courseRepository.update(id, updateData);
    if (updated) {
      await this.invalidateCourseCaches();
    }
    return updated;
  }

  async updateCourseStatus(
    id: string,
    status: CourseStatus,
  ): Promise<Course | null> {
    const existingCourse = await this.courseRepository.findByIdNotDeleted(id);
    if (!existingCourse) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    // Validate status transition
    if (!Object.values(CourseStatus).includes(status)) {
      throw new BadRequestException(`Invalid course status: ${status}`);
    }

    const updated = await this.courseRepository.update(id, { status });
    if (updated) {
      await this.invalidateCourseCaches();
    }
    return updated;
  }

  async softDeleteCourse(id: string): Promise<void> {
    await this.courseRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    await this.invalidateCourseCaches();
  }

  async restoreCourse(id: string): Promise<Course | null> {
    const restored = await this.courseRepository.update(id, {
      isDeleted: false,
      deletedAt: null,
    });
    if (restored) {
      await this.invalidateCourseCaches();
    }
    return restored;
  }

  async deleteCourse(id: string): Promise<void> {
    await this.courseRepository.delete(id);
    await this.invalidateCourseCaches();
  }

  async findByAuthorId(authorId: string): Promise<Course[]> {
    return this.courseRepository.findByAuthorIdNotDeleted(authorId);
  }

  async findBySubjectId(subjectId: string): Promise<Course[]> {
    return this.courseRepository.findBySubjectIdNotDeleted(subjectId);
  }

  async findPublished(): Promise<Course[]> {
    return this.courseRepository.findByStatusNotDeleted(CourseStatus.Published);
  }

  async findByGradeLevel(gradeLevel: GradeLevel): Promise<Course[]> {
    return this.courseRepository.findByGradeLevelNotDeleted(gradeLevel);
  }

  async getChaptersWithLessons(courseId: string): Promise<any[]> {
    // TODO: Implement actual logic to get chapters with lessons
    return this.courseRepository.getChaptersWithLessons(courseId);
  }

  // Legacy method - deprecated, use updateCourseStatus instead
  async publishCourse(id: string): Promise<Course | null> {
    return this.updateCourseStatus(id, CourseStatus.Published);
  }

  /**
   * Teacher submits their course for Admin review.
   * Only courses in Draft or Rejected status can be submitted.
   *
   * Completeness checks (all applied before the status transition):
   *  1. Course must have at least 1 active (non-deleted) Chapter.
   *  2. Every active Chapter must have at least 1 active (non-deleted) Lesson.
   *  3. Every active Lesson must have at least 1 Question OR at least 1 Material.
   */
  async submitForReview(courseId: string, authorId: string): Promise<Course> {
    const course = await this.courseRepository.findByIdNotDeleted(courseId);
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    if (course.authorId !== authorId) {
      throw new ForbiddenException(
        'You do not have permission to submit this course for review',
      );
    }
    if (
      course.status !== CourseStatus.Draft &&
      course.status !== CourseStatus.Rejected
    ) {
      throw new BadRequestException(
        `Cannot submit for review. Only Draft or Rejected courses can be submitted. Current status: ${course.status}`,
      );
    }

    // ── Completeness validation ────────────────────────────────────────────

    // 1. At least 1 active Chapter
    const allChapters = await this.chapterRepository.findByCourseId(courseId);
    const activeChapters = allChapters.filter((c) => !c.isDeleted);
    if (activeChapters.length === 0) {
      throw new BadRequestException(
        'Course must have at least 1 chapter before submitting for review.',
      );
    }

    // 2. Each active Chapter must have at least 1 active Lesson
    // 3. Each active Lesson must have at least 1 Question or Material
    const chapterLessonPairs = await Promise.all(
      activeChapters.map(async (chapter) => {
        const allLessons = await this.lessonRepository.findByChapterId(
          chapter.id,
        );
        const activeLessons = allLessons.filter((l) => !l.isDeleted);
        return { chapter, activeLessons };
      }),
    );

    const chapterWithoutLessons = chapterLessonPairs.find(
      (entry) => entry.activeLessons.length === 0,
    );
    if (chapterWithoutLessons) {
      throw new BadRequestException(
        `Chapter "${chapterWithoutLessons.chapter.title}" must have at least 1 lesson before submitting for review.`,
      );
    }

    const lessonValidationResults = await Promise.all(
      chapterLessonPairs.flatMap(({ chapter, activeLessons }) =>
        activeLessons.map(async (lesson) => {
          const [questions, materials] = await Promise.all([
            this.questionRepository.findByLessonId(lesson.id),
            this.materialRepository.findByLessonId(lesson.id),
          ]);

          if (questions.length === 0 && materials.length === 0) {
            return `Lesson "${lesson.title}" in chapter "${chapter.title}" must have at least 1 question or material before submitting for review.`;
          }
          return null;
        }),
      ),
    );

    const firstLessonValidationError = lessonValidationResults.find(
      (message): message is string => Boolean(message),
    );
    if (firstLessonValidationError) {
      throw new BadRequestException(firstLessonValidationError);
    }

    // ── All checks passed — transition to Under_Review ────────────────────
    const updated = await this.courseRepository.update(courseId, {
      status: CourseStatus.Under_Review,
      approvalNote: null, // Clear previous rejection note
    });
    if (!updated) {
      throw new NotFoundException('Failed to submit course for review');
    }
    await this.invalidateCourseCaches();
    return updated;
  }

  /**
   * Admin approves a course — status becomes Published.
   */
  async approveCourse(courseId: string, note?: string): Promise<Course> {
    const course = await this.courseRepository.findByIdNotDeleted(courseId);
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    if (course.status !== CourseStatus.Under_Review) {
      throw new BadRequestException(
        `Only courses Under Review can be approved. Current status: ${course.status}`,
      );
    }

    const updated = await this.courseRepository.update(courseId, {
      status: CourseStatus.Published,
      approvalNote: note ?? null,
    });
    if (!updated) {
      throw new NotFoundException('Failed to approve course');
    }

    await this.invalidateCourseCaches();

    void this.tryPushCourseApprovalNotification(
      updated.authorId,
      updated.title,
      updated.id,
      'approved',
    );

    return updated;
  }

  /**
   * Admin rejects a course — status goes back to Rejected with a mandatory note.
   */
  async rejectCourse(courseId: string, note: string): Promise<Course> {
    if (!note || note.trim().length === 0) {
      throw new BadRequestException('Rejection reason (note) is required');
    }
    const course = await this.courseRepository.findByIdNotDeleted(courseId);
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    if (course.status !== CourseStatus.Under_Review) {
      throw new BadRequestException(
        `Only courses Under Review can be rejected. Current status: ${course.status}`,
      );
    }

    const updated = await this.courseRepository.update(courseId, {
      status: CourseStatus.Rejected,
      approvalNote: note.trim(),
    });
    if (!updated) {
      throw new NotFoundException('Failed to reject course');
    }

    await this.invalidateCourseCaches();

    void this.tryPushCourseApprovalNotification(
      updated.authorId,
      updated.title,
      updated.id,
      'rejected',
      note.trim(),
    );

    return updated;
  }

  private async tryPushCourseApprovalNotification(
    authorUserId: string,
    courseName: string,
    courseId: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    try {
      const author = await this.usersService.findById(authorUserId);
      if (!author?.email) return;

      await this.notificationTriggers.onCourseApproval(
        author.id,
        author.email,
        courseName,
        courseId,
        status,
        reason,
        author.email.split('@')[0],
      );
    } catch {
      // Notification failures must never block course moderation flow
    }
  }

  /**
   * Admin dashboard aggregation — course counts by status.
   */
  async getCourseStatistics(): Promise<{
    total: number;
    published: number;
    underReview: number;
    draft: number;
    rejected: number;
    archived: number;
    deleted: number;
  }> {
    const [total, published, underReview, draft, rejected, archived, deleted] =
      await Promise.all([
        this.courseRepository.countByFilter({}),
        this.courseRepository.countByFilter({
          status: CourseStatus.Published,
          isDeleted: { $ne: true },
        }),
        this.courseRepository.countByFilter({
          status: CourseStatus.Under_Review,
          isDeleted: { $ne: true },
        }),
        this.courseRepository.countByFilter({
          status: CourseStatus.Draft,
          isDeleted: { $ne: true },
        }),
        this.courseRepository.countByFilter({
          status: CourseStatus.Rejected,
          isDeleted: { $ne: true },
        }),
        this.courseRepository.countByFilter({
          status: CourseStatus.Archived,
          isDeleted: { $ne: true },
        }),
        this.courseRepository.countByFilter({ isDeleted: true }),
      ]);
    return {
      total,
      published,
      underReview,
      draft,
      rejected,
      archived,
      deleted,
    };
  }
}
