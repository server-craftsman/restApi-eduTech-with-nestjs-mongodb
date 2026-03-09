/**
 * BadgeType — all achievable badges in the Simple Reward system.
 *
 * Unlocked automatically when a student's totalPoints crosses the
 * corresponding threshold (see BADGE_THRESHOLDS in reward.service.ts).
 * Once unlocked, a badge is never removed.
 */
export enum BadgeType {
  /** 10 points  — First lesson completed */
  FirstStep = 'first_step',
  /** 100 points — Consistent learner */
  Diligent = 'diligent',
  /** 500 points — Half way to Scholar */
  RisingStar = 'rising_star',
  /** 1 000 points — Top student ("Học bá") */
  Scholar = 'scholar',
  /** 3 000 points — Exceptional achiever */
  Champion = 'champion',
  /** 5 000 points — Gold Avatar Frame ("Khung Avatar Vàng") */
  GoldAvatarFrame = 'gold_avatar_frame',
  /** 10 000 points — Legendary status */
  Legend = 'legend',
}
