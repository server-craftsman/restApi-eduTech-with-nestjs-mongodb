import { Injectable } from '@nestjs/common';
import { StudentProfileService } from '../student-profiles/student-profile.service';
import { BadgeType } from '../enums';
import { BadgeCatalogItemDto, MyRewardsDto } from './dto';
import { UsersService } from '../users/users.service';
import { NotificationTriggersService } from '../notifications/services';

// ── Point values per event ────────────────────────────────────────────────────

/** Points awarded when a lesson is completed for the FIRST TIME. */
export const POINTS_LESSON_COMPLETED = 10;

/** Points awarded when a quiz attempt scores 100 (all questions correct). */
export const POINTS_PERFECT_QUIZ = 50;

// ── Badge threshold table ─────────────────────────────────────────────────────

export interface BadgeThreshold {
  badge: BadgeType;
  minPoints: number;
  label: string;
  description: string;
}

/**
 * Ordered ascending by minPoints — the reward engine walks this list to find
 * which badges a student has newly earned after an award.
 */
export const BADGE_THRESHOLDS: BadgeThreshold[] = [
  {
    badge: BadgeType.FirstStep,
    minPoints: 10,
    label: 'Bước đầu tiên',
    description: 'Hoàn thành bài học đầu tiên (tích lũy 10 điểm)',
  },
  {
    badge: BadgeType.Diligent,
    minPoints: 100,
    label: 'Chăm chỉ',
    description: 'Tích lũy đủ 100 điểm thưởng',
  },
  {
    badge: BadgeType.RisingStar,
    minPoints: 500,
    label: 'Ngôi sao mới nổi',
    description: 'Tích lũy đủ 500 điểm thưởng',
  },
  {
    badge: BadgeType.Scholar,
    minPoints: 1_000,
    label: 'Học bá',
    description: 'Tích lũy đủ 1 000 điểm thưởng',
  },
  {
    badge: BadgeType.Champion,
    minPoints: 3_000,
    label: 'Quán quân',
    description: 'Tích lũy đủ 3 000 điểm thưởng',
  },
  {
    badge: BadgeType.GoldAvatarFrame,
    minPoints: 5_000,
    label: 'Khung Avatar Vàng',
    description: 'Tích lũy đủ 5 000 điểm thưởng',
  },
  {
    badge: BadgeType.Legend,
    minPoints: 10_000,
    label: 'Huyền thoại',
    description: 'Tích lũy đủ 10 000 điểm thưởng',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RewardService {
  constructor(
    private readonly studentProfileService: StudentProfileService,
    private readonly usersService: UsersService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  // ── Public trigger methods ─────────────────────────────────────────────────

  /**
   * Award +10 points for completing a lesson (first time only).
   * Called fire-and-forget from LessonProgressService — errors are silently swallowed.
   */
  async awardLessonCompletion(userId: string): Promise<void> {
    await this.awardPoints(
      userId,
      POINTS_LESSON_COMPLETED,
      'hoàn thành bài học',
    );
  }

  /**
   * Award +50 points for a perfect quiz score (100%).
   * Called fire-and-forget from QuizAttemptService — errors are silently swallowed.
   */
  async awardPerfectQuiz(userId: string): Promise<void> {
    await this.awardPoints(
      userId,
      POINTS_PERFECT_QUIZ,
      'hoàn thành bài kiểm tra xuất sắc',
    );
  }

  // ── Query helpers ──────────────────────────────────────────────────────────

  /**
   * Return the student's current reward state enriched with next-badge info.
   */
  async getMyRewards(userId: string): Promise<MyRewardsDto | null> {
    const profile = await this.studentProfileService.getProfileByUserId(userId);
    if (!profile) return null;

    const totalPoints = profile.totalPoints;
    const badges = profile.badges;

    const nextThreshold = BADGE_THRESHOLDS.find(
      (t) => totalPoints < t.minPoints,
    );

    return {
      totalPoints,
      badges,
      nextBadge: nextThreshold
        ? this.thresholdToCatalogItem(nextThreshold)
        : null,
      pointsToNextBadge: nextThreshold
        ? nextThreshold.minPoints - totalPoints
        : null,
    };
  }

  /**
   * Return the full badge catalog (public, no auth needed).
   */
  getBadgeCatalog(): BadgeCatalogItemDto[] {
    return BADGE_THRESHOLDS.map((t) => this.thresholdToCatalogItem(t));
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Core award logic:
   *  1. Atomically increment totalPoints ($inc — concurrent-safe)
   *  2. Compute which badges are newly earned based on the new total
   *  3. Append each new badge via $addToSet (idempotent)
   */
  private async awardPoints(
    userId: string,
    points: number,
    reason: string,
  ): Promise<void> {
    const updated = await this.studentProfileService.incrementPoints(
      userId,
      points,
    );
    if (!updated) return; // no profile for this user — silently skip

    const user = await this.usersService.findById(userId);
    if (user?.email) {
      void this.notificationTriggers
        .onPointsEarned(
          user.id,
          user.email,
          points,
          reason,
          user.email.split('@')[0],
        )
        .catch(() => undefined);
    }

    const newBadges = this.computeNewBadges(
      updated.totalPoints,
      updated.badges,
    );
    for (const badge of newBadges) {
      await this.studentProfileService.addBadge(userId, badge);

      if (user?.email) {
        const badgeLabel =
          BADGE_THRESHOLDS.find((t) => t.badge === badge)?.label ?? badge;
        void this.notificationTriggers
          .onBadgeUnlocked(
            user.id,
            user.email,
            badgeLabel,
            undefined,
            user.email.split('@')[0],
          )
          .catch(() => undefined);
      }
    }
  }

  /**
   * Determine which badges the student should receive given their new point total.
   * Only includes badges not already in `existingBadges`.
   */
  private computeNewBadges(
    totalPoints: number,
    existingBadges: BadgeType[],
  ): BadgeType[] {
    return BADGE_THRESHOLDS.filter(
      (t) => totalPoints >= t.minPoints && !existingBadges.includes(t.badge),
    ).map((t) => t.badge);
  }

  private thresholdToCatalogItem(t: BadgeThreshold): BadgeCatalogItemDto {
    return {
      badge: t.badge,
      label: t.label,
      description: t.description,
      minPoints: t.minPoints,
    };
  }
}
