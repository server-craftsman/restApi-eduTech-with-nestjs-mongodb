import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LessonProgressRepositoryAbstract } from './infrastructure/persistence/document/repositories/lesson-progress.repository.abstract';
import { LessonProgress } from './domain/lesson-progress';
import { RewardService } from '../rewards/reward.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';

/** Maximum number of unique lessons a Free-tier user may access per day. */
const FREE_DAILY_LESSON_LIMIT = 5;

@Injectable()
export class LessonProgressService {
  constructor(
    private readonly lessonProgressRepository: LessonProgressRepositoryAbstract,
    private readonly rewardService: RewardService,
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async createProgress(
    data: Omit<LessonProgress, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LessonProgress> {
    return this.lessonProgressRepository.create(data);
  }

  async getProgressById(id: string): Promise<LessonProgress | null> {
    return this.lessonProgressRepository.findById(id);
  }

  async getAllProgress(): Promise<LessonProgress[]> {
    return this.lessonProgressRepository.findAll();
  }

  async deleteProgress(id: string): Promise<void> {
    return this.lessonProgressRepository.delete(id);
  }

  async findByUserId(userId: string): Promise<LessonProgress[]> {
    return this.lessonProgressRepository.findByUserId(userId);
  }

  async findByLessonId(lessonId: string): Promise<LessonProgress[]> {
    return this.lessonProgressRepository.findByLessonId(lessonId);
  }

  async getProgressByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    return this.lessonProgressRepository.findByUserAndLesson(userId, lessonId);
  }

  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    return this.lessonProgressRepository.findByUserAndLesson(userId, lessonId);
  }

  async updateProgressByUserAndLesson(
    userId: string,
    lessonId: string,
    data: Partial<LessonProgress>,
  ): Promise<LessonProgress | null> {
    const existing = await this.findByUserAndLesson(userId, lessonId);
    const isFirstCompletion =
      data.isCompleted === true && !existing?.isCompleted;

    // ── Free-tier daily lesson access gate ──────────────────────────────────
    // If this is the user's FIRST access to this lesson today (no existing
    // progress record), enforce the Free daily limit before creating one.
    if (!existing) {
      const subStatus =
        await this.userSubscriptionService.checkSubscriptionStatus(userId);

      if (!subStatus.isPro) {
        // Subscription has lapsed — tell user to renew, not upgrade
        if (subStatus.hasExpired) {
          throw new HttpException(
            {
              statusCode: HttpStatus.PAYMENT_REQUIRED,
              requiresRenewal: true,
              message:
                'Gói Pro của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục học không giới hạn.',
              upgradeUrl: '/payments/plans/compare',
            },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        const todayCount =
          await this.lessonProgressRepository.countNewLessonsToday(userId);
        if (todayCount >= FREE_DAILY_LESSON_LIMIT) {
          throw new HttpException(
            {
              statusCode: HttpStatus.PAYMENT_REQUIRED,
              requiresUpgrade: true,
              message: `Bạn đã truy cập ${FREE_DAILY_LESSON_LIMIT} bài học hôm nay. Nâng cấp Pro để học không giới hạn.`,
              upgradeUrl: '/payments/plans/compare',
              remaining: 0,
            },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    let result: LessonProgress | null;
    if (existing) {
      result = await this.lessonProgressRepository.update(existing.id, data);
    } else {
      // Tạo mới với default values
      result = await this.lessonProgressRepository.create({
        userId,
        lessonId,
        isCompleted: false,
        lastWatchedSec: 0,
        progressPercent: 0,
        videoWatched: false,
        videoCurrentTime: 0,
        videoDuration: 0,
        quizCompleted: false,
        ...data,
      });
    }

    if (isFirstCompletion) {
      void this.tryAwardLessonCompletion(userId);
    }
    return result;
  }

  // Overloaded updateProgress method - support both old and new signatures
  async updateProgress(
    idOrUserId: string,
    dataOrLessonId?: Partial<LessonProgress> | string,
    data?: Partial<LessonProgress>,
  ): Promise<LessonProgress | null> {
    if (typeof dataOrLessonId === 'string' && data) {
      // New signature: updateProgress(userId, lessonId, data)
      return this.updateProgressByUserAndLesson(
        idOrUserId,
        dataOrLessonId,
        data,
      );
    } else {
      // Old signature: updateProgress(id, data)
      return this.lessonProgressRepository.update(
        idOrUserId,
        dataOrLessonId as Partial<LessonProgress>,
      );
    }
  }

  async updateWatchedTime(
    userId: string,
    lessonId: string,
    seconds: number,
  ): Promise<LessonProgress | null> {
    return this.lessonProgressRepository.updateWatchedTime(
      userId,
      lessonId,
      seconds,
    );
  }

  async completeLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    const progress = await this.lessonProgressRepository.findByUserAndLesson(
      userId,
      lessonId,
    );
    if (progress) {
      if (progress.isCompleted) {
        // Already completed — no points awarded again
        return progress;
      }
      const result = await this.lessonProgressRepository.update(progress.id, {
        isCompleted: true,
      });
      void this.tryAwardLessonCompletion(userId);
      return result;
    }
    const result = await this.lessonProgressRepository.create({
      userId,
      lessonId,
      isCompleted: true,
      lastWatchedSec: 0,
      progressPercent: 0,
      videoWatched: false,
      videoCurrentTime: 0,
      videoDuration: 0,
      quizCompleted: false,
    });
    void this.tryAwardLessonCompletion(userId);
    return result;
  }

  /**
   * Fire-and-forget wrapper — reward failure never breaks lesson tracking.
   */
  private async tryAwardLessonCompletion(userId: string): Promise<void> {
    try {
      await this.rewardService.awardLessonCompletion(userId);
    } catch {
      // silently swallow — never break lesson progress updates
    }
  }
}
