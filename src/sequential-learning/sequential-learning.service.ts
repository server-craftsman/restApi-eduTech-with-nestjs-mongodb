import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { QuizAttemptService } from '../quiz-attempts/quiz-attempt.service';
import { LessonService } from '../lessons/lesson.service';
import { QuestionService } from '../questions/question.service';
import { ChapterService } from '../chapters/chapter.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';
import {
  VideoProgressRequestDto,
  QuizSubmitDto,
  QuizResultDto,
  LessonStatusDto,
  CurriculumDto,
  ChapterInCurriculumDto,
  LessonInCurriculumDto,
  QuestionForStudentDto,
  QuizAnswerDetailDto,
} from './dto';

// ---------------------------------------------------------------------------
// Legacy interfaces kept for backward-compat with other callers
// ---------------------------------------------------------------------------
export interface VideoTrackingDto {
  lessonId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
}

export interface QuizSubmissionDto {
  lessonId: string;
  answers: Array<{ questionId: string; selectedAnswer: string }>;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  details: Array<{
    questionId: string;
    correct: boolean;
    selectedAnswer: string;
    correctAnswer: string;
  }>;
}
// ---------------------------------------------------------------------------

/** Passing score threshold (80 %) */
const PASS_THRESHOLD = 80;

/** Consider video "watched" once >= 90 % of it has been seen */
const VIDEO_WATCH_THRESHOLD = 0.9;

/** Maximum number of lesson quiz submissions a Free-tier user may make per day. */
const FREE_DAILY_LESSON_QUIZ_LIMIT = 5;

@Injectable()
export class SequentialLearningService {
  constructor(
    private readonly lessonProgressService: LessonProgressService,
    private readonly quizAttemptService: QuizAttemptService,
    private readonly lessonService: LessonService,
    private readonly questionService: QuestionService,
    private readonly chapterService: ChapterService,
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  // =========================================================================
  // STEP 1 — Curriculum tree
  // =========================================================================

  /**
   * Return the full chapter → lesson tree for a course, annotated with the
   * current student's progress (locked/watched/quizPassed).
   */
  async getCurriculum(
    userId: string,
    courseId: string,
  ): Promise<CurriculumDto> {
    const chapters = await this.chapterService.findByCourseId(courseId);

    let totalLessons = 0;
    let completedLessons = 0;
    const chapterDtos: ChapterInCurriculumDto[] = [];

    for (const chapter of chapters) {
      const lessons = await this.lessonService.findByChapterIdOrdered(
        chapter.id,
      );
      let chapterCompleted = 0;

      const lessonDtos: LessonInCurriculumDto[] = [];
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const progress = await this.lessonProgressService.findByUserAndLesson(
          userId,
          lesson.id,
        );

        // First lesson of the first chapter is always unlocked;
        // all others require the previous lesson to be completed
        const isLocked =
          i === 0 ? false : await this._isLocked(userId, lessons[i - 1].id);
        const isCompleted = (progress?.progressPercent ?? 0) === 100;
        if (isCompleted) chapterCompleted++;

        lessonDtos.push({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          orderIndex: lesson.orderIndex,
          durationSeconds: lesson.video?.durationSeconds ?? 0,
          isPreview: lesson.isPreview,
          isLocked,
          videoWatched: progress?.videoWatched ?? false,
          quizCompleted: progress?.quizCompleted ?? false,
          quizScore: progress?.quizScore ?? null,
          isCompleted,
        });
      }

      totalLessons += lessons.length;
      completedLessons += chapterCompleted;
      chapterDtos.push({
        id: chapter.id,
        title: chapter.title,
        orderIndex: chapter.orderIndex,
        completedLessons: chapterCompleted,
        totalLessons: lessons.length,
        lessons: lessonDtos,
      });
    }

    const overallProgressPercent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      courseId,
      totalLessons,
      completedLessons,
      overallProgressPercent,
      chapters: chapterDtos,
    };
  }

  // =========================================================================
  // STEP 2a — Track video progress (periodic heartbeat)
  // =========================================================================

  /**
   * Called periodically (e.g. every 10 s) while the student watches the video.
   * Marks videoWatched automatically once >= 90 % is reached.
   */
  async trackVideoProgress(
    userId: string,
    dto: VideoProgressRequestDto,
  ): Promise<void> {
    const { lessonId, currentTime, duration, completed } = dto;
    if (!lessonId) {
      throw new BadRequestException('lessonId is required');
    }
    if (duration <= 0) return;

    const progressPercent = Math.min(
      Math.round((currentTime / duration) * 100),
      100,
    );
    const videoWatched =
      completed || currentTime / duration >= VIDEO_WATCH_THRESHOLD;

    await this.lessonProgressService.updateProgressByUserAndLesson(
      userId,
      lessonId,
      {
        progressPercent,
        videoWatched,
        lastWatchedAt: new Date(),
        lastWatchedSec: Math.max(0, Math.round(currentTime)),
        videoCurrentTime: currentTime,
        videoDuration: duration,
      },
    );
  }

  // =========================================================================
  // STEP 2b — Complete video (explicit "done" signal)
  // =========================================================================

  /**
   * Explicitly marks the video as fully watched.
   * Triggered when the player fires its "ended" event or the student clicks
   * a "Mark as watched" button.
   * Returns updated status so the UI can light up the quiz button.
   */
  async completeVideo(
    userId: string,
    lessonId: string,
  ): Promise<LessonStatusDto> {
    const lesson = await this.lessonService.findById(lessonId);
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

    // Determine whether a quiz exists for this lesson.
    // Video-only lessons are considered fully "completed" once the video is watched;
    // lessons with a quiz require the quiz to be passed for full completion.
    const questions = await this.questionService.findByLessonId(lessonId);
    const hasQuiz = questions.length > 0;

    await this.lessonProgressService.updateProgressByUserAndLesson(
      userId,
      lessonId,
      {
        videoWatched: true,
        progressPercent: 100,
        lastWatchedSec: lesson.video?.durationSeconds ?? 0,
        videoCurrentTime: lesson.video?.durationSeconds ?? 0,
        videoDuration: lesson.video?.durationSeconds ?? 0,
        lastWatchedAt: new Date(),
        // Only mark the lesson as completed here when there is no quiz;
        // the reward guard in LessonProgressService ensures +10 is awarded once.
        ...(!hasQuiz ? { isCompleted: true } : {}),
      },
    );

    return this.getLessonStatus(userId, lessonId);
  }

  // =========================================================================
  // STEP 3a — Fetch quiz questions (student-safe, no correct answers)
  // =========================================================================

  /**
   * Returns quiz questions for a lesson.
   * correctAnswer is intentionally omitted — grading is done server-side.
   * Throws ForbiddenException if video hasn't been watched yet.
   */
  async getQuizQuestions(
    userId: string,
    lessonId: string,
  ): Promise<QuestionForStudentDto[]> {
    const canAccess = await this.canAccessQuiz(userId, lessonId);
    if (!canAccess) {
      throw new ForbiddenException(
        'You must finish watching the video before taking the quiz.',
      );
    }

    const questions = await this.questionService.findByLessonId(lessonId);
    if (questions.length === 0) {
      throw new NotFoundException(
        `No quiz questions found for lesson ${lessonId}`,
      );
    }

    return questions.map((q) => ({
      id: q.id,
      contentHtml: q.contentHtml,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options,
    }));
  }

  // =========================================================================
  // STEP 3b — Submit quiz answers
  // =========================================================================

  /**
   * Submits quiz answers.
   * - Grading is delegated to QuizAttemptService (server-side)
   * - score >= 80 % → marks lesson complete + returns nextLessonId
   */
  async submitQuizForLesson(
    userId: string,
    lessonId: string,
    dto: QuizSubmitDto,
  ): Promise<QuizResultDto> {
    const canAccess = await this.canAccessQuiz(userId, lessonId);
    if (!canAccess) {
      throw new ForbiddenException(
        'You must finish watching the video before submitting the quiz.',
      );
    }

    const lesson = await this.lessonService.findById(lessonId);
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

    const questions = await this.questionService.findByLessonId(lessonId);
    if (questions.length === 0) {
      throw new BadRequestException('This lesson has no quiz questions');
    }

    // ── Free-tier daily lesson quiz gate ───────────────────────────────────
    const subStatus =
      await this.userSubscriptionService.checkSubscriptionStatus(userId);
    if (!subStatus.isPro) {
      // Subscription lapsed — renewal UX
      if (subStatus.hasExpired) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            requiresRenewal: true,
            message:
              'Gói Pro của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục làm quiz không giới hạn.',
            upgradeUrl: '/payments/plans/compare',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const todayCount =
        await this.quizAttemptService.countTodayAttemptsByUser(userId);
      if (todayCount >= FREE_DAILY_LESSON_QUIZ_LIMIT) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            requiresUpgrade: true,
            message: `Bạn đã hết lượt làm quiz hôm nay (${FREE_DAILY_LESSON_QUIZ_LIMIT} lần/ngày). Nâng cấp Pro để học và luyện tập không giới hạn.`,
            upgradeUrl: '/payments/plans/compare',
            remaining: 0,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const attempt = await this.quizAttemptService.submitAttempt(userId, {
      lessonId,
      answers: dto.answers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
      })),
      totalTimeSpentMs: dto.timeSpentMs,
    });

    const passed = attempt.score >= PASS_THRESHOLD;

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const details: QuizAnswerDetailDto[] = attempt.answers.map((a) => {
      const q = questionMap.get(a.questionId);
      const selected = Array.isArray(a.selectedAnswer)
        ? a.selectedAnswer.join(', ')
        : a.selectedAnswer;
      return {
        questionId: a.questionId,
        correct: a.isCorrect,
        selectedAnswer: selected,
        correctAnswer: q?.correctAnswer ?? '',
        explanation: q?.explanation ?? '',
      };
    });

    if (passed) {
      await this.lessonProgressService.updateProgressByUserAndLesson(
        userId,
        lessonId,
        {
          quizCompleted: true,
          quizScore: attempt.score,
          progressPercent: 100,
          isCompleted: true,
        },
      );
    } else {
      const existing = await this.lessonProgressService.findByUserAndLesson(
        userId,
        lessonId,
      );
      if (!existing?.quizScore || attempt.score > existing.quizScore) {
        await this.lessonProgressService.updateProgressByUserAndLesson(
          userId,
          lessonId,
          {
            quizScore: attempt.score,
          },
        );
      }
    }

    // Discover next lesson
    let nextLessonId: string | null = null;
    let nextLessonTitle: string | null = null;

    if (passed) {
      const nextLesson = await this.lessonService.findNextLesson(lessonId);
      if (nextLesson) {
        nextLessonId = nextLesson.id;
        nextLessonTitle = nextLesson.title;
        // Initialise an empty progress record so the next lesson is "visible"
        await this.lessonProgressService.updateProgressByUserAndLesson(
          userId,
          nextLesson.id,
          {},
        );
      }
    }

    return {
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      passed,
      nextLessonId,
      nextLessonTitle,
      details,
    };
  }

  // =========================================================================
  // Lesson status
  // =========================================================================

  /**
   * Returns the full status of a lesson for the student.
   * Drives the UI: lock state, quiz button enabled, completion badge.
   */
  async getLessonStatus(
    userId: string,
    lessonId: string,
  ): Promise<LessonStatusDto> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );

    const videoWatched = progress?.videoWatched ?? false;
    const quizCompleted = progress?.quizCompleted ?? false;
    const quizScore = progress?.quizScore ?? null;
    const progressPercent = progress?.progressPercent ?? 0;

    const lesson = await this.lessonService.findById(lessonId);
    const prevLesson = lesson
      ? await this.lessonService.findPreviousLesson(lessonId)
      : null;
    const isLocked = prevLesson
      ? await this._isLocked(userId, prevLesson.id)
      : false;

    return {
      lessonId,
      videoWatched,
      videoCurrentTime: progress?.videoCurrentTime ?? 0,
      videoDuration: progress?.videoDuration ?? 0,
      progressPercent,
      canAccessQuiz: videoWatched,
      quizCompleted,
      quizScore,
      isCompleted: progressPercent === 100 && quizCompleted,
      isLocked,
    };
  }

  /** Check if a student may access the quiz (video must be watched first) */
  async canAccessQuiz(userId: string, lessonId: string): Promise<boolean> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );
    return progress?.videoWatched ?? false;
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  /**
   * Returns true when a lesson is still LOCKED.
   * Locked = video not watched OR (has quiz AND quiz score < 80 %).
   */
  private async _isLocked(userId: string, lessonId: string): Promise<boolean> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );
    if (!progress?.videoWatched) return true;

    const questions = await this.questionService.findByLessonId(lessonId);
    if (questions.length === 0) return false; // No quiz → video alone unlocks

    return (
      !progress.quizCompleted || (progress.quizScore ?? 0) < PASS_THRESHOLD
    );
  }

  // ---------------------------------------------------------------------------
  // Legacy method — kept for backward-compat (learning-path.service.ts uses it)
  // ---------------------------------------------------------------------------

  /** @deprecated Use submitQuizForLesson() instead */
  async submitQuiz(
    userId: string,
    quizData: QuizSubmissionDto,
  ): Promise<QuizResult> {
    const { lessonId, answers } = quizData;

    const canAccess = await this.canAccessQuiz(userId, lessonId);
    if (!canAccess) {
      throw new BadRequestException(
        'You must watch the video before taking the quiz',
      );
    }

    const lesson = await this.lessonService.findById(lessonId);
    if (!lesson) throw new BadRequestException('Lesson not found');

    const questions = await this.questionService.findByLessonId(lessonId);
    if (!questions || questions.length === 0) {
      throw new BadRequestException('This lesson has no quiz questions');
    }

    const attempt = await this.quizAttemptService.submitAttempt(userId, {
      lessonId,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
      })),
      totalTimeSpentMs: 0,
    });

    const passed = attempt.score >= PASS_THRESHOLD;
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const details = attempt.answers.map((a) => {
      const q = questionMap.get(a.questionId);
      const selected = Array.isArray(a.selectedAnswer)
        ? a.selectedAnswer.join(', ')
        : a.selectedAnswer;
      return {
        questionId: a.questionId,
        correct: a.isCorrect,
        selectedAnswer: selected,
        correctAnswer: q?.correctAnswer ?? '',
      };
    });

    if (passed) {
      await this.lessonProgressService.updateProgressByUserAndLesson(
        userId,
        lessonId,
        {
          quizCompleted: true,
          quizScore: attempt.score,
          progressPercent: 100,
          isCompleted: true,
        },
      );
    }

    return {
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      passed,
      details,
    };
  }
}
