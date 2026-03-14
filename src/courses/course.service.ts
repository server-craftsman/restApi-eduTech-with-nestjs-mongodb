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
  ) {
    super();
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
    return this.courseRepository.create(courseData);
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

    const [courses, total] = await this.courseRepository.findAllWithFilters(
      limit,
      offset,
      filters,
      (query.sort as SortCourseDto[]) ?? [],
    );
    return { courses, total };
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
    return this.courseRepository.update(id, updateData);
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

    return this.courseRepository.update(id, { status });
  }

  async softDeleteCourse(id: string): Promise<void> {
    await this.courseRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  async restoreCourse(id: string): Promise<Course | null> {
    return this.courseRepository.update(id, {
      isDeleted: false,
      deletedAt: null,
    });
  }

  async deleteCourse(id: string): Promise<void> {
    return this.courseRepository.delete(id);
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
    //    3. Each active Lesson must have at least 1 Question or Material
    for (const chapter of activeChapters) {
      const allLessons = await this.lessonRepository.findByChapterId(
        chapter.id,
      );
      const activeLessons = allLessons.filter((l) => !l.isDeleted);

      if (activeLessons.length === 0) {
        throw new BadRequestException(
          `Chapter "${chapter.title}" must have at least 1 lesson before submitting for review.`,
        );
      }

      for (const lesson of activeLessons) {
        const [questions, materials] = await Promise.all([
          this.questionRepository.findByLessonId(lesson.id),
          this.materialRepository.findByLessonId(lesson.id),
        ]);

        if (questions.length === 0 && materials.length === 0) {
          throw new BadRequestException(
            `Lesson "${lesson.title}" in chapter "${chapter.title}" must have at least 1 question or material before submitting for review.`,
          );
        }
      }
    }

    // ── All checks passed — transition to Under_Review ────────────────────
    const updated = await this.courseRepository.update(courseId, {
      status: CourseStatus.Under_Review,
      approvalNote: null, // Clear previous rejection note
    });
    if (!updated) {
      throw new NotFoundException('Failed to submit course for review');
    }
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
