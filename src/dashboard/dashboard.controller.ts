import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { LearningPathService } from '../learning-path/learning-path.service';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { StudentProfileService } from '../student-profiles/student-profile.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly learningPathService: LearningPathService,
    private readonly lessonProgressService: LessonProgressService,
    private readonly studentProfileService: StudentProfileService,
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user dashboard with learning progress overview',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboard(@CurrentUser() user: User) {
    // ─── Onboarding gate ────────────────────────────────────────────────────────
    // Students must complete the onboarding questionnaire first.
    // Other roles (Teacher, Admin, Parent) skip onboarding entirely.
    const studentProfile = await this.studentProfileService.getProfileByUserId(
      user.id,
    );

    if (studentProfile && !studentProfile.onboardingCompleted) {
      return {
        needsOnboarding: true,
        onboardingUrl: '/student-profiles/onboarding',
        message:
          'Please complete your onboarding to personalise your learning experience.',
      };
    }

    // ─── Grade level personalisation gate ─────────────────────────────
    // Get user's grade level from student profile
    const gradeLevel =
      studentProfile?.gradeLevel ?? user.studentProfile?.gradeLevel;
    if (!gradeLevel) {
      return {
        error: 'User does not have a grade level set',
        learningPath: [],
        progressSummary: {
          totalLessons: 0,
          completedLessons: 0,
          progressPercent: 0,
          totalXP: 0,
        },
      };
    }

    // ─── Subscription tier ─────────────────────────────────────────────
    const isPro = await this.userSubscriptionService.isSubscriptionValid(
      user.id,
    );
    // ─────────────────────────────────────────────────────────────────────────

    // Get learning path
    const learningPath = await this.learningPathService.getLearningPath(
      user.id,
      gradeLevel,
    );

    // Calculate progress summary
    const userProgress = await this.lessonProgressService.findByUserId(user.id);
    const completedLessons = userProgress.filter((p) => p.isCompleted).length;
    const totalLessons = userProgress.length;
    const progressPercent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Calculate total XP (assume 100 XP per completed lesson)
    const totalXP = completedLessons * 100;

    return {
      learningPath,
      progressSummary: {
        totalLessons,
        completedLessons,
        progressPercent,
        totalXP,
      },
      userInfo: {
        email: user.email,
        gradeLevel,
        currentStreak:
          studentProfile?.currentStreak ??
          user.studentProfile?.currentStreak ??
          0,
        diamondBalance:
          studentProfile?.diamondBalance ??
          user.studentProfile?.diamondBalance ??
          0,
      },
      // Personalisation hints: the frontend uses these to pre-populate filters
      // when calling GET /courses so that only grade-appropriate content is shown.
      personalization: {
        gradeLevel,
        preferredSubjectIds: studentProfile?.preferredSubjectIds ?? [],
        contentFilterHint: gradeLevel
          ? `Use GET /courses?filters={"gradeLevelId":"<id for grade ${gradeLevel}>"} ` +
            `to see only grade-${gradeLevel} courses.`
          : null,
      },
      // ── Plan-tier metadata ───────────────────────────────────────────────
      plan: {
        isPro,
        showAds: !isPro,
        /** Daily limits — frontend should display usage counters for Free users */
        dailyLimits: isPro
          ? null
          : {
              lessons: { limit: 5, description: 'Bài học tối đa mỗi ngày' },
              exams: { limit: 2, description: 'Lượt thi tối đa mỗi ngày' },
            },
        upgradeUrl: isPro ? null : '/payments/plans/compare',
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get detailed learning statistics' })
  @ApiResponse({
    status: 200,
    description: 'Learning statistics retrieved successfully',
  })
  async getLearningStats(@CurrentUser() user: User) {
    const [userProgress, isPro] = await Promise.all([
      this.lessonProgressService.findByUserId(user.id),
      this.userSubscriptionService.isSubscriptionValid(user.id),
    ]);

    // Group progress by completion status
    const completed = userProgress.filter((p) => p.isCompleted);
    const inProgress = userProgress.filter(
      (p) => p.progressPercent > 0 && !p.isCompleted,
    );
    const notStarted = userProgress.filter((p) => p.progressPercent === 0);

    // Weekly progress chart — Pro feature only
    const weeklyProgress = isPro
      ? [
          { week: 'Week 1', completed: 5 },
          { week: 'Week 2', completed: 8 },
          { week: 'Week 3', completed: 6 },
          { week: 'Week 4', completed: 10 },
        ]
      : null;

    return {
      lessonStats: {
        completed: completed.length,
        inProgress: inProgress.length,
        notStarted: notStarted.length,
        total: userProgress.length,
      },
      /** `null` for Free users — upgrade to Pro to unlock detailed charts */
      weeklyProgress,
      achievements: [
        {
          name: 'First Lesson',
          description: 'Complete your first lesson',
          earned: completed.length > 0,
        },
        {
          name: 'Week Warrior',
          description: 'Complete 7 lessons in a week',
          earned: false,
        },
        {
          name: 'Quiz Master',
          description: 'Score 100% on 5 quizzes',
          earned: false,
        },
      ],
      // ── Plan-tier metadata ─────────────────────────────────────────────────
      plan: {
        isPro,
        showAds: !isPro,
        weeklyProgressLocked: !isPro,
        upgradeUrl: isPro ? null : '/payments/plans/compare',
      },
    };
  }
}
