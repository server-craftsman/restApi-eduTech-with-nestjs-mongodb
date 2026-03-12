import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationTriggersService } from './notification-triggers.service';

/**
 * NotificationSchedulerService — scheduled cron jobs for automated reminders.
 *
 * Jobs:
 *   1. Streak reminder  — daily at 18:00 (UTC+7 = 11:00 UTC)
 *   2. Inactive reminder — daily at 10:00 (UTC+7 = 03:00 UTC)
 *
 * NOTE: Exam reminders are triggered event-based (when an exam is scheduled),
 *       not via cron — see ExamService or a separate exam-reminder queue.
 *
 * These crons use UserRepository (injected via a dynamic import or a
 * dedicated query service) to find eligible users. To avoid circular
 * dependency with UsersModule, we import the abstract repository token.
 */
@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(private readonly triggers: NotificationTriggersService) {}

  /**
   * Streak Reminder — runs every day at 18:00 (Vietnam time, UTC+7).
   *
   * Implementation note:
   * In production, inject UserRepositoryAbstract and query students
   * who have NOT completed any lesson today but have streak > 0.
   *
   * For now, this is a placeholder demonstrating the cron pattern.
   * The actual user-query logic should be added once the lesson-progress
   * module exposes a method like `findStudentsWithStreakAtRisk()`.
   */
  @Cron('0 11 * * *', { name: 'streak-reminder', timeZone: 'Asia/Ho_Chi_Minh' })
  handleStreakReminder(): void {
    this.logger.log('Running streak reminder cron job...');

    // TODO: Inject UserRepositoryAbstract or a dedicated StreakQueryService
    // to find students who:
    //   1. Have currentStreak > 0
    //   2. Have NOT completed any lesson/quiz today
    //   3. Have isActive=true, isDeleted=false, role=STUDENT
    //
    // Example (uncomment when UserRepository is injected):
    // const studentsAtRisk = await this.userRepo.findStudentsWithStreakAtRisk();
    // for (const student of studentsAtRisk) {
    //   await this.triggers.onStreakReminder(
    //     student.id,
    //     student.email,
    //     student.studentProfile?.currentStreak ?? 0,
    //     student.email.split('@')[0],
    //   );
    // }

    this.logger.log('Streak reminder cron job completed');
  }

  /**
   * Inactive Reminder — runs every day at 10:00 (Vietnam time).
   *
   * Targets students who haven't logged in / completed any activity
   * for 3+ days.
   *
   * Same implementation note as above — requires a method like
   * `findInactiveStudents(daysSinceLastActivity: number)`.
   */
  @Cron('0 3 * * *', {
    name: 'inactive-reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  handleInactiveReminder(): void {
    this.logger.log('Running inactive reminder cron job...');

    // TODO: Inject UserRepositoryAbstract or a dedicated ActivityQueryService
    // to find students who:
    //   1. Have NOT logged in or completed any activity for 3+ days
    //   2. Have isActive=true, isDeleted=false, role=STUDENT
    //
    // Example (uncomment when ready):
    // const inactiveStudents = await this.userRepo.findInactiveStudents(3);
    // for (const student of inactiveStudents) {
    //   await this.triggers.onInactiveReminder(
    //     student.id,
    //     student.email,
    //     student.daysSinceLastActivity,
    //     student.email.split('@')[0],
    //   );
    // }

    this.logger.log('Inactive reminder cron job completed');
  }
}
