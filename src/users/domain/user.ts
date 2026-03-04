import {
  UserRole,
  EmailVerificationStatus,
  GradeLevel,
  ApprovalStatus,
} from '../../enums';
import { CloudinaryAsset } from '../../core/interfaces';

export interface StudentProfile {
  gradeLevel: GradeLevel;
  currentStreak: number;
  diamondBalance: number;
  xpTotal: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  /** Avatar URL — can be a string for backward compat or CloudinaryAsset object from POST /uploads */
  avatarUrl?: string | CloudinaryAsset | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  studentProfile?: StudentProfile | null;
  emailVerificationStatus: EmailVerificationStatus;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetOtp?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  // ── Approval workflow (Teacher / Parent accounts) ──────────────────────────
  approvalStatus?: ApprovalStatus | null;
  approvalRejectionReason?: string | null;
  approvalReviewedAt?: Date | null;
  /** ID of the admin User who performed the last review action. */
  approvalReviewedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
