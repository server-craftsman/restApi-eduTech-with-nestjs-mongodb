/**
 * CollectionName — single source of truth for all MongoDB collection names.
 *
 * Every @Schema({ collection: '...' }) MUST reference a value from this enum
 * so collection names are never scattered as string literals throughout the
 * codebase.
 */
export enum CollectionName {
  Users = 'users',
  Roles = 'roles',
  Sessions = 'sessions',
  StudentProfiles = 'student_profiles',
  TeacherProfiles = 'teacher_profiles',
  ParentProfiles = 'parent_profiles',
  ParentStudentLinks = 'parent_student_links',
  Courses = 'courses',
  Chapters = 'chapters',
  Lessons = 'lessons',
  LessonProgress = 'lesson_progress',
  Materials = 'materials',
  Questions = 'questions',
  QuizAttempts = 'quiz_attempts',
  Subjects = 'subjects',
  GradeLevels = 'grade_levels',
  SubscriptionPlans = 'subscription_plans',
  UserSubscriptions = 'user_subscriptions',
  Transactions = 'transactions',
  Notifications = 'notifications',
  // ── AI Chatbot ──
  AiConversations = 'ai_conversations',
  AiTrainingData = 'ai_training_data',
  // ── Review / Wrong-Answer Bank ──
  WrongAnswers = 'wrong_answers',
  // ── Exam Flow ──
  Exams = 'exams',
  ExamAttempts = 'exam_attempts',
}
