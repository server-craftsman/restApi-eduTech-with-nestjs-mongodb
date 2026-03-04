import { TeacherEducationLevel } from '../../enums';

export interface TeacherProfile {
  id: string;
  userId: string;
  fullName: string;
  bio?: string | null;

  // ── Approval-review fields ─────────────────────────────────────────────────
  /** Phone number for admin contact and verification. */
  phoneNumber?: string | null;
  /** List of subjects the teacher is qualified to teach (e.g. ["Math","Physics"]). */
  subjectsTaught?: string[];
  /** Number of years of teaching experience. */
  yearsOfExperience?: number | null;
  /** Highest education level attained. */
  educationLevel?: TeacherEducationLevel | null;
  /** URLs of uploaded teaching certificates / credentials. */
  certificateUrls?: string[];
  /** URL of the uploaded CV / résumé document. */
  cvUrl?: string | null;
  /** Optional LinkedIn profile URL. */
  linkedinUrl?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
