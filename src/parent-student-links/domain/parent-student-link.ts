export interface ParentStudentLink {
  id: string;
  /** Profile ID of the parent (references parent_profiles._id). Null until the parent connects via link code. */
  parentId: string | null;
  /** Profile ID of the student (references student_profiles._id) */
  studentId: string;
  isVerified: boolean;
  /** 8-char uppercase alphanumeric code the student shares with the parent */
  linkCode?: string | null;
  /** Expiry timestamp of the link code (24 h after generation) */
  linkCodeExpires?: Date | null;
  /** Timestamp of the last automated progress report sent to the parent */
  lastReportSentAt?: Date | null;
  createdAt: Date;
}
