/**
 * NotificationType — categorizes the kind of notification.
 * Used across domain, DTO, schema, and Novu workflow trigger layers.
 */
export enum NotificationType {
  /** Points earned from completing a lesson or quiz */
  PointsEarned = 'points_earned',
  /** New badge unlocked */
  BadgeUnlocked = 'badge_unlocked',
  /** New assignment/lesson available */
  NewAssignment = 'new_assignment',
  /** New course published or updated */
  NewCourse = 'new_course',
  /** Upcoming exam reminder */
  ExamReminder = 'exam_reminder',
  /** Streak reminder — user hasn't studied today */
  StreakReminder = 'streak_reminder',
  /** User has been inactive for N days */
  InactiveReminder = 'inactive_reminder',
  /** Subscription activated/expired */
  SubscriptionUpdate = 'subscription_update',
  /** Payment confirmed */
  PaymentConfirmed = 'payment_confirmed',
  /** System announcement */
  SystemAnnouncement = 'system_announcement',
  /** Quiz result available */
  QuizResult = 'quiz_result',
  /** Parent-student link update */
  ParentLinkUpdate = 'parent_link_update',
  /** Course approval status change (for teachers) */
  CourseApproval = 'course_approval',
  /** Teacher account approval/rejection by admin */
  TeacherApproval = 'teacher_approval',
}
