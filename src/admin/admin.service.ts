import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CourseService } from '../courses/course.service';
import { TransactionService } from '../transactions/transaction.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';
import { NotificationTriggersService } from '../notifications/services/notification-triggers.service';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { User } from '../users/domain/user';
import { TransactionStatus, SubscriptionStatus } from '../enums';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly courseService: CourseService,
    private readonly transactionService: TransactionService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  // ─── Dashboard Aggregation ──────────────────────────────────────────────────

  /**
   * Aggregates platform-wide statistics for the admin dashboard.
   * All calls run in parallel for maximum performance.
   */
  async getDashboardStats(): Promise<AdminDashboardDto> {
    const [
      userStats,
      courseStats,
      pendingApprovals,
      allTransactions,
      allSubscriptions,
    ] = await Promise.all([
      this.usersService.getStatistics(),
      this.courseService.getCourseStatistics(),
      this.usersService.findPendingApprovals(1000, 0), // [users[], total]
      this.transactionService.getAllTransactions(),
      this.userSubscriptionService.getAllSubscriptions(),
    ]);

    // ── Revenue aggregation ─────────────────────────────────────────────────
    const successTxs = allTransactions.filter(
      (t) => t.status === TransactionStatus.Success,
    );
    const pendingTxs = allTransactions.filter(
      (t) => t.status === TransactionStatus.Pending,
    );
    const failedTxs = allTransactions.filter(
      (t) => t.status === TransactionStatus.Failed,
    );
    const totalRevenue = successTxs.reduce((sum, t) => sum + t.amount, 0);

    // ── Subscription aggregation ─────────────────────────────────────────────
    const activeSubs = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Active,
    );
    const expiredSubs = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Expired,
    );
    const cancelledSubs = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Cancelled,
    );

    return {
      users: {
        ...userStats,
        pendingApprovals: pendingApprovals[1], // total count
      },
      courses: courseStats,
      revenue: {
        totalRevenue,
        successfulTransactions: successTxs.length,
        pendingTransactions: pendingTxs.length,
        failedTransactions: failedTxs.length,
      },
      subscriptions: {
        total: allSubscriptions.length,
        active: activeSubs.length,
        expired: expiredSubs.length,
        cancelled: cancelledSubs.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Teacher Pending List ───────────────────────────────────────────────────

  async getPendingTeachers(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await this.usersService.findPendingApprovals(
      limit,
      offset,
    );
    return { data, total, page, limit };
  }

  // ─── Teacher Approval ───────────────────────────────────────────────────────

  /**
   * Admin approves a pending teacher account.
   * Updates approval fields and fires a notification (fire-and-forget).
   */
  async approveTeacher(adminId: string, userId: string): Promise<User> {
    // Fetch email before approve for notification (throws if not found/not teacher/not pending)
    const targetUser = await this.usersService.findById(userId);
    if (!targetUser) throw new NotFoundException(`User ${userId} not found`);

    const updated = await this.usersService.approveTeacher(adminId, userId);

    // Fire-and-forget notification
    void this.tryNotifyTeacherApproval(
      userId,
      targetUser.email,
      'approved',
      undefined,
    );

    return updated;
  }

  /**
   * Admin rejects a teacher account with a mandatory reason.
   * Updates rejection fields and fires a notification (fire-and-forget).
   */
  async rejectTeacher(
    adminId: string,
    userId: string,
    reason: string,
  ): Promise<User> {
    const targetUser = await this.usersService.findById(userId);
    if (!targetUser) throw new NotFoundException(`User ${userId} not found`);
    if (!reason?.trim())
      throw new BadRequestException('Rejection reason is required');

    const updated = await this.usersService.rejectTeacher(
      adminId,
      userId,
      reason,
    );

    // Fire-and-forget notification
    void this.tryNotifyTeacherApproval(
      userId,
      targetUser.email,
      'rejected',
      reason,
    );

    return updated;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async tryNotifyTeacherApproval(
    userId: string,
    email: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    try {
      await this.notificationTriggers.onTeacherApproval(
        userId,
        email,
        status,
        reason,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Teacher approval notification failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
