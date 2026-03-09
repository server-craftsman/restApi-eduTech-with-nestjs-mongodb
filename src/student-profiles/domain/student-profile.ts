import { GradeLevel } from '../../enums';

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
  createdAt: Date;
  updatedAt: Date;
}
