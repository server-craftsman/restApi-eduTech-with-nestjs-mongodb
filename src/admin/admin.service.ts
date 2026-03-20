import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CourseService } from '../courses/course.service';
import { TransactionService } from '../transactions/transaction.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';
import { NotificationTriggersService } from '../notifications/services/notification-triggers.service';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { SeedLearningDataResponseDto } from './dto/seed-learning-data.dto';
import { User } from '../users/domain/user';
import {
  CourseStatus,
  Difficulty,
  ExamScope,
  QuestionType,
  SubscriptionStatus,
  TransactionStatus,
} from '../enums';
import { SubjectService } from '../subjects/subject.service';
import { GradeLevelService } from '../grade-levels/grade-level.service';
import { ChapterService } from '../chapters/chapter.service';
import { LessonService } from '../lessons/lesson.service';
import { MaterialService } from '../materials/material.service';
import { QuestionService } from '../questions/question.service';
import { ExamService } from '../exams/exam.service';
import { MaterialType } from '../materials/dto/create-material.dto';
import {
  VIETNAM_GRADE_NAME,
  VIETNAM_GRADE_VALUE,
  VIETNAM_LEARNING_SEED,
  LessonSeedTemplate,
} from './seed/learning-seed.data';

type SeedCounter = {
  subjects: number;
  gradeLevels: number;
  courses: number;
  chapters: number;
  lessons: number;
  materials: number;
  quizQuestions: number;
  chapterQuizzes: number;
  chapterExams: number;
  finalExams: number;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly courseService: CourseService,
    private readonly transactionService: TransactionService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly subjectService: SubjectService,
    private readonly gradeLevelService: GradeLevelService,
    private readonly chapterService: ChapterService,
    private readonly lessonService: LessonService,
    private readonly materialService: MaterialService,
    private readonly questionService: QuestionService,
    private readonly examService: ExamService,
  ) {}

  // ─── Dashboard Aggregation ──────────────────────────────────────────────────

  /**
   * Aggregates platform-wide statistics for the admin dashboard.
   * All calls run in parallel for maximum performance.
   */
  async getDashboardStats(): Promise<AdminDashboardDto> {
    const [
      userStats,
      courseStats,
      pendingApprovals,
      allTransactions,
      allSubscriptions,
    ] = await Promise.all([
      this.usersService.getStatistics(),
      this.courseService.getCourseStatistics(),
      this.usersService.findPendingApprovals(1000, 0), // [users[], total]
      this.transactionService.getAllTransactions(),
      this.userSubscriptionService.getAllSubscriptions(),
    ]);

    // ── Revenue aggregation ─────────────────────────────────────────────────
    const successTxs = allTransactions.filter(
      (t) => t.status === TransactionStatus.Success,
    );
    const pendingTxs = allTransactions.filter(
      (t) => t.status === TransactionStatus.Pending,
    );
    const failedTxs = allTransactions.filter(
      (t) => t.status === TransactionStatus.Failed,
    );
    const totalRevenue = successTxs.reduce((sum, t) => sum + t.amount, 0);

    // ── Subscription aggregation ─────────────────────────────────────────────
    const activeSubs = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Active,
    );
    const expiredSubs = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Expired,
    );
    const cancelledSubs = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Cancelled,
    );

    return {
      users: {
        ...userStats,
        pendingApprovals: pendingApprovals[1], // total count
      },
      courses: courseStats,
      revenue: {
        totalRevenue,
        successfulTransactions: successTxs.length,
        pendingTransactions: pendingTxs.length,
        failedTransactions: failedTxs.length,
      },
      subscriptions: {
        total: allSubscriptions.length,
        active: activeSubs.length,
        expired: expiredSubs.length,
        cancelled: cancelledSubs.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Teacher Pending List ───────────────────────────────────────────────────

  async getPendingTeachers(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await this.usersService.findPendingApprovals(
      limit,
      offset,
    );
    return { data, total, page, limit };
  }

  // ─── Teacher Approval ───────────────────────────────────────────────────────

  /**
   * Admin approves a pending teacher account.
   * Updates approval fields and fires a notification (fire-and-forget).
   */
  async approveTeacher(adminId: string, userId: string): Promise<User> {
    // Fetch email before approve for notification (throws if not found/not teacher/not pending)
    const targetUser = await this.usersService.findById(userId);
    if (!targetUser) throw new NotFoundException(`User ${userId} not found`);

    const updated = await this.usersService.approveTeacher(adminId, userId);

    // Fire-and-forget notification
    void this.tryNotifyTeacherApproval(
      userId,
      targetUser.email,
      'approved',
      undefined,
    );

    return updated;
  }

  /**
   * Admin rejects a teacher account with a mandatory reason.
   * Updates rejection fields and fires a notification (fire-and-forget).
   */
  async rejectTeacher(
    adminId: string,
    userId: string,
    reason: string,
  ): Promise<User> {
    const targetUser = await this.usersService.findById(userId);
    if (!targetUser) throw new NotFoundException(`User ${userId} not found`);
    if (!reason?.trim())
      throw new BadRequestException('Rejection reason is required');

    const updated = await this.usersService.rejectTeacher(
      adminId,
      userId,
      reason,
    );

    // Fire-and-forget notification
    void this.tryNotifyTeacherApproval(
      userId,
      targetUser.email,
      'rejected',
      reason,
    );

    return updated;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async tryNotifyTeacherApproval(
    userId: string,
    email: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    try {
      await this.notificationTriggers.onTeacherApproval(
        userId,
        email,
        status,
        reason,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Teacher approval notification failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Seed meaningful Vietnam learning data via one admin endpoint.
   *
   * Minimum guaranteed:
   * - 5 subjects
   * - 5 courses (1 course / subject)
   * - each course: 3 chapters + 1 final exam
   * - each chapter: 3 lessons + 1 chapter exam + 1 chapter quiz
   * - each lesson: 3 materials + 3 quiz questions
   */
  async seedLearningData(
    adminUserId: string,
  ): Promise<SeedLearningDataResponseDto> {
    const created = this.zeroCounter();
    const reused = this.zeroCounter();

    let gradeLevel =
      await this.gradeLevelService.findByValue(VIETNAM_GRADE_VALUE);
    if (!gradeLevel) {
      gradeLevel = await this.gradeLevelService.createGradeLevel({
        name: VIETNAM_GRADE_NAME,
        value: VIETNAM_GRADE_VALUE,
      });
      created.gradeLevels++;
    } else {
      reused.gradeLevels++;
    }

    const subjects = await this.subjectService.getAllSubjects();

    for (const courseSeed of VIETNAM_LEARNING_SEED) {
      let subject = subjects.find((s) => s.name === courseSeed.subjectName);
      if (!subject) {
        subject = await this.subjectService.createSubject({
          name: courseSeed.subjectName,
          iconUrl: courseSeed.subjectIconUrl,
        });
        subjects.push(subject);
        created.subjects++;
      } else {
        reused.subjects++;
      }

      const coursesBySubject = await this.courseService.findBySubjectId(
        subject.id,
      );
      let course = coursesBySubject.find((c) => c.title === courseSeed.title);

      if (!course) {
        course = await this.courseService.createCourse({
          subjectId: subject.id,
          gradeLevelId: gradeLevel.id,
          authorId: adminUserId,
          title: courseSeed.title,
          description: courseSeed.description,
          thumbnailUrl: courseSeed.thumbnailUrl,
          type: courseSeed.type,
          status: CourseStatus.Draft,
          isDeleted: false,
          deletedAt: null,
        });
        created.courses++;
      } else {
        reused.courses++;
      }

      const existingChapters = await this.chapterService.findByCourseId(
        course.id,
      );
      const allCourseQuestionIds: string[] = [];

      for (
        let chapterIndex = 0;
        chapterIndex < courseSeed.chapters.length;
        chapterIndex++
      ) {
        const chapterSeed = courseSeed.chapters[chapterIndex];

        let chapter = existingChapters.find(
          (c) => c.title === chapterSeed.title,
        );
        if (!chapter) {
          chapter = await this.chapterService.create({
            courseId: course.id,
            title: chapterSeed.title,
            description: chapterSeed.description,
            orderIndex: chapterIndex,
          });
          created.chapters++;
          existingChapters.push(chapter);
        } else {
          reused.chapters++;
        }

        const existingLessons = await this.lessonService.findByChapterId(
          chapter.id,
        );
        const chapterQuestionIds: string[] = [];

        for (
          let lessonIndex = 0;
          lessonIndex < chapterSeed.lessons.length;
          lessonIndex++
        ) {
          const lessonSeed = chapterSeed.lessons[lessonIndex];

          let lesson = existingLessons.find(
            (l) => l.title === lessonSeed.title,
          );
          if (!lesson) {
            const lessonVideo = this.resolveLessonVideoAsset(
              courseSeed.subjectName,
              chapterSeed.title,
              lessonSeed,
            );

            lesson = await this.lessonService.createLesson({
              chapterId: chapter.id,
              title: lessonSeed.title,
              description: lessonSeed.description,
              orderIndex: lessonIndex,
              video: {
                url: lessonVideo.url,
                publicId: lessonVideo.publicId,
                fileSize: lessonVideo.fileSize,
                durationSeconds: lessonSeed.videoDurationSeconds,
              },
              contentMd: this.buildLessonContent(
                courseSeed.title,
                chapterSeed.title,
                lessonSeed,
              ),
              isPreview: lessonIndex === 0,
            });
            created.lessons++;
            existingLessons.push(lesson);
          } else {
            reused.lessons++;
          }

          const existingMaterials = await this.materialService.findByLessonId(
            lesson.id,
          );
          const materialTemplates = this.buildMaterialTemplates(
            courseSeed.subjectName,
            chapterSeed.title,
            lessonSeed.title,
            lesson.id,
          );

          for (const material of materialTemplates) {
            const found = existingMaterials.find(
              (m) => m.title === material.title,
            );
            if (found) {
              reused.materials++;
              continue;
            }

            await this.materialService.createMaterial(material);
            created.materials++;
          }

          const existingQuestions = await this.questionService.findByLessonId(
            lesson.id,
          );
          const questionTemplates = this.buildLessonQuestionTemplates(
            lesson.id,
            courseSeed.subjectName,
            chapterSeed.title,
            lessonSeed,
          );

          for (const q of questionTemplates) {
            const found = existingQuestions.find(
              (existingQuestion) =>
                existingQuestion.contentHtml === q.contentHtml,
            );

            if (found) {
              reused.quizQuestions++;
              chapterQuestionIds.push(found.id);
              allCourseQuestionIds.push(found.id);
              continue;
            }

            const createdQuestion =
              await this.questionService.createQuestion(q);
            created.quizQuestions++;
            chapterQuestionIds.push(createdQuestion.id);
            allCourseQuestionIds.push(createdQuestion.id);
          }
        }

        await this.ensureExamExists({
          title: `Quiz ${chapterSeed.title} - ${courseSeed.subjectName} 10`,
          description:
            'Quiz nhanh theo chương, phù hợp ôn tập trước giờ kiểm tra 15 phút.',
          scope: ExamScope.Chapter,
          courseId: course.id,
          chapterId: chapter.id,
          timeLimitSeconds: 15 * 60,
          passingScore: 60,
          questionIds: chapterQuestionIds.slice(0, 6),
          creatorId: adminUserId,
          createdCounterKey: 'chapterQuizzes',
          created,
          reused,
        });

        await this.ensureExamExists({
          title: `Kiểm tra ${chapterSeed.title} - ${courseSeed.subjectName} 10`,
          description:
            'Bài kiểm tra chương theo định dạng đánh giá năng lực cuối chương.',
          scope: ExamScope.Chapter,
          courseId: course.id,
          chapterId: chapter.id,
          timeLimitSeconds: 30 * 60,
          passingScore: 65,
          questionIds: chapterQuestionIds.slice(0, 9),
          creatorId: adminUserId,
          createdCounterKey: 'chapterExams',
          created,
          reused,
        });
      }

      await this.ensureExamExists({
        title: `Đề thi cuối khóa - ${courseSeed.title}`,
        description:
          'Đề thi tổng hợp cuối khóa, bao quát toàn bộ kiến thức trọng tâm của 3 chương.',
        scope: ExamScope.Course,
        courseId: course.id,
        chapterId: undefined,
        timeLimitSeconds: 45 * 60,
        passingScore: 70,
        questionIds: allCourseQuestionIds.slice(0, 18),
        creatorId: adminUserId,
        createdCounterKey: 'finalExams',
        created,
        reused,
      });
    }

    return {
      created,
      reused,
      summary:
        'Seed completed: 5 subjects, 5 courses, each course with 3 chapters, each chapter with 3 lessons, 3 materials per lesson, plus chapter quizzes/exams and final exam.',
    };
  }

  private zeroCounter(): SeedCounter {
    return {
      subjects: 0,
      gradeLevels: 0,
      courses: 0,
      chapters: 0,
      lessons: 0,
      materials: 0,
      quizQuestions: 0,
      chapterQuizzes: 0,
      chapterExams: 0,
      finalExams: 0,
    };
  }

  private slugify(input: string): string {
    return input
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private resolveLessonVideoAsset(
    subjectName: string,
    chapterTitle: string,
    lesson: LessonSeedTemplate,
  ): { publicId: string; url: string; fileSize: number } {
    if (lesson.video?.publicId && lesson.video?.url) {
      return {
        publicId: lesson.video.publicId,
        url: lesson.video.url,
        fileSize: lesson.video.fileSize ?? 120_000_000,
      };
    }

    const slug = this.slugify(`${subjectName}-${chapterTitle}-${lesson.title}`);
    const publicId = `edutech/lessons/${slug}`;

    return {
      publicId,
      url: `https://res.cloudinary.com/dym0se5if/video/upload/${publicId}.mp4`,
      fileSize: 120_000_000,
    };
  }

  private buildLessonContent(
    courseTitle: string,
    chapterTitle: string,
    lesson: LessonSeedTemplate,
  ): string {
    return [
      `# ${lesson.title}`,
      '',
      `Khóa học: **${courseTitle}**`,
      `Chương: **${chapterTitle}**`,
      '',
      '## Mục tiêu bài học',
      `- Nắm chắc khái niệm trọng tâm: **${lesson.keyConcept}**.`,
      `- Vận dụng vào tình huống thực tế: ${lesson.practiceContext}.`,
      '- Tự luyện tập trước khi vào bài kiểm tra chương.',
      '',
      '## Ghi nhớ',
      `> Từ khóa quan trọng của bài: **${lesson.keyConcept}**.`,
    ].join('\n');
  }

  private buildMaterialTemplates(
    subjectName: string,
    chapterTitle: string,
    lessonTitle: string,
    lessonId: string,
  ): Array<{
    lessonId: string;
    title: string;
    file: { url: string; publicId: string; fileSize: number };
    type: MaterialType;
    description: string;
  }> {
    const baseSlug = this.slugify(
      `${subjectName}-${chapterTitle}-${lessonTitle}`,
    );

    return [
      {
        lessonId,
        title: `Tóm tắt lý thuyết - ${lessonTitle}`,
        file: {
          url: `https://cdn.edutech.vn/materials/${baseSlug}-tom-tat.pdf`,
          publicId: `seed/materials/${baseSlug}-tom-tat`,
          fileSize: 1_400_000,
        },
        type: MaterialType.PDF,
        description:
          'Tài liệu tóm tắt ngắn gọn kiến thức trọng tâm để ôn tập nhanh trước khi làm bài.',
      },
      {
        lessonId,
        title: `Bài tập thực hành - ${lessonTitle}`,
        file: {
          url: `https://cdn.edutech.vn/materials/${baseSlug}-bai-tap.docx`,
          publicId: `seed/materials/${baseSlug}-bai-tap`,
          fileSize: 980_000,
        },
        type: MaterialType.DOC,
        description:
          'Bộ bài tập ứng dụng theo ngữ cảnh học đường Việt Nam, có độ khó tăng dần.',
      },
      {
        lessonId,
        title: `Slide minh họa - ${lessonTitle}`,
        file: {
          url: `https://cdn.edutech.vn/materials/${baseSlug}-slide.pptx`,
          publicId: `seed/materials/${baseSlug}-slide`,
          fileSize: 2_200_000,
        },
        type: MaterialType.PRESENTATION,
        description:
          'Slide minh họa phục vụ dạy học trên lớp và tự học tại nhà.',
      },
    ];
  }

  private buildLessonQuestionTemplates(
    lessonId: string,
    subjectName: string,
    chapterTitle: string,
    lesson: LessonSeedTemplate,
  ): Array<{
    lessonId: string;
    contentHtml: string;
    type: QuestionType;
    difficulty: Difficulty;
    options: string[];
    correctAnswer: string;
    explanation: string;
    tags: string[];
    points: number;
  }> {
    return [
      {
        lessonId,
        contentHtml: `<p>Trong bài <strong>${lesson.title}</strong> (${subjectName}), khái niệm trọng tâm là gì?</p>`,
        type: QuestionType.MultipleChoice,
        difficulty: Difficulty.Easy,
        options: [
          lesson.keyConcept,
          'ghi nhớ máy móc',
          'học vẹt công thức',
          'đoán đáp án ngẫu nhiên',
        ],
        correctAnswer: lesson.keyConcept,
        explanation: `Bài học này xoay quanh khái niệm "${lesson.keyConcept}" và cách vận dụng trong thực tế học tập.`,
        tags: [subjectName, chapterTitle, 'seed', 'core-concept'],
        points: 10,
      },
      {
        lessonId,
        contentHtml: `<p>Nhận định sau đúng hay sai: "${lesson.practiceContext}" là ví dụ ứng dụng của <strong>${lesson.keyConcept}</strong>.</p>`,
        type: QuestionType.TrueFalse,
        difficulty: Difficulty.Medium,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `Nhận định đúng vì tình huống này giúp học sinh dùng ${lesson.keyConcept} để giải quyết vấn đề thực tiễn.`,
        tags: [subjectName, chapterTitle, 'seed', 'application'],
        points: 10,
      },
      {
        lessonId,
        contentHtml:
          '<p>Điền vào chỗ trống: Từ khóa quan trọng nhất của bài học này là <strong>_____</strong>.</p>',
        type: QuestionType.FillInBlank,
        difficulty: Difficulty.Easy,
        options: [],
        correctAnswer: lesson.keyConcept,
        explanation: `Đáp án là "${lesson.keyConcept}" vì đây là khái niệm cốt lõi xuyên suốt nội dung bài.`,
        tags: [subjectName, chapterTitle, 'seed', 'fill-in-blank'],
        points: 10,
      },
    ];
  }

  private async ensureExamExists(params: {
    title: string;
    description: string;
    scope: ExamScope;
    courseId: string;
    chapterId?: string;
    timeLimitSeconds: number;
    passingScore: number;
    questionIds: string[];
    creatorId: string;
    createdCounterKey: keyof Pick<
      SeedCounter,
      'chapterQuizzes' | 'chapterExams' | 'finalExams'
    >;
    created: SeedCounter;
    reused: SeedCounter;
  }): Promise<void> {
    const uniqueQuestionIds = Array.from(new Set(params.questionIds));
    if (uniqueQuestionIds.length === 0) return;

    const existing = await this.examService.listExams({
      page: 1,
      limit: 300,
      filters: {
        scope: params.scope,
        courseId: params.courseId,
        chapterId: params.chapterId,
      },
      sort: [{ orderBy: 'createdAt', order: 'desc' }],
    });

    const existed = existing.items.find((exam) => exam.title === params.title);
    if (existed) {
      params.reused[params.createdCounterKey] += 1;
      return;
    }

    await this.examService.createExam(
      {
        title: params.title,
        description: params.description,
        scope: params.scope,
        courseId: params.courseId,
        chapterId: params.chapterId,
        questionIds: uniqueQuestionIds,
        timeLimitSeconds: params.timeLimitSeconds,
        passingScore: params.passingScore,
        isPublished: true,
      },
      params.creatorId,
    );

    params.created[params.createdCounterKey] += 1;
  }
}
