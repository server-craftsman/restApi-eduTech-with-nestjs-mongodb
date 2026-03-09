import { BadgeType, GradeLevel } from '../../enums';

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  schoolName?: string | null;
  gradeLevel?: GradeLevel | null;
  /** IDs of subjects the student prefers (set during onboarding) */
  preferredSubjectIds: string[];
  /** True once the student completes the onboarding questionnaire */
  onboardingCompleted: boolean;
  diamondBalance: number;
  xpTotal: number;
  currentStreak: number;
  /** Accumulated reward points (lesson completions + perfect quiz scores) */
  totalPoints: number;
  /** Badges unlocked by crossing point thresholds (never removed once earned) */
  badges: BadgeType[];
  createdAt: Date;
  updatedAt: Date;
}
