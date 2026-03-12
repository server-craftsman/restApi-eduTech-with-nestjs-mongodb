import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '../../enums';
import { NotificationRepositoryAbstract } from '../infrastructure/persistence/document/repositories/notification.repository.abstract';
import { Notification } from '../domain/notification';
import { NovuService } from './novu.service';
import { MailService } from '../../mail/mail.service';

/**
 * NotificationTriggersService — high-level business event handlers.
 *
 * Each method:
 *   1. Builds the notification payload (title, message, actionUrl, metadata)
 *   2. Saves it to MongoDB (in-app bell icon)
 *   3. Triggers Novu workflow for multi-channel delivery (email, push in future)
 *   4. Falls back to direct email via MailService if Novu is not enabled
 *
 * Other services (RewardService, ExamService, etc.) call these methods
 * instead of creating notifications directly.
 */
@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger(NotificationTriggersService.name);

  constructor(
    private readonly notificationRepository: NotificationRepositoryAbstract,
    private readonly novuService: NovuService,
    private readonly mailService: MailService,
  ) {}

  // ─── Helper ────────────────────────────────────────────────────────────────

  /**
   * Core method — persists notification and triggers external channels.
   */
  private async sendNotification(params: {
    userId: string;
    email: string;
    firstName?: string;
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    sendEmail?: boolean;
    novuWorkflowId?: string;
  }): Promise<Notification> {
    const {
      userId,
      email,
      firstName,
      title,
      message,
      type,
      actionUrl,
      metadata,
      sendEmail = true,
      novuWorkflowId,
    } = params;

    let novuMessageId: string | null = null;
    let emailSent = false;

    // 1. Trigger Novu workflow (handles in-app + email on Novu side)
    if (novuWorkflowId) {
      const txId = await this.novuService.triggerWorkflow({
        workflowId: novuWorkflowId,
        userId,
        email,
        firstName,
        title,
        message,
        type,
        actionUrl,
        metadata,
      });
      if (txId) {
        novuMessageId = txId;
        emailSent = true; // Novu handles the email channel
      }
    }

    // 2. Fallback: send email directly via MailService if Novu is not enabled
    if (sendEmail && !emailSent && email) {
      try {
        await this.mailService.sendNotificationEmail(email, title, message, actionUrl);
        emailSent = true;
      } catch (err: unknown) {
        this.logger.warn(
          `Direct email fallback failed for user ${userId}: ${(err as Error).message}`,
        );
      }
    }

    // 3. Persist in-app notification to MongoDB
    const notification = await this.notificationRepository.create({
      userId,
      title,
      message,
      isRead: false,
      type,
      actionUrl: actionUrl ?? null,
      metadata: metadata ?? null,
      emailSent,
      novuMessageId,
    });

    this.logger.log(
      `Notification [${type}] sent to user ${userId}: "${title}" (email: ${emailSent})`,
    );

    return notification;
  }

  // ─── Gamification Events ───────────────────────────────────────────────────

  /**
   * User earned points from completing a lesson or quiz.
   */
  async onPointsEarned(
    userId: string,
    email: string,
    points: number,
    reason: string,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `+${points} điểm thưởng! 🎉`,
      message: `Bạn vừa nhận được ${points} XP từ ${reason}. Tiếp tục học để tích lũy thêm điểm!`,
      type: NotificationType.PointsEarned,
      metadata: { points, reason },
      novuWorkflowId: 'points-earned',
      sendEmail: false, // Points earned is frequent — skip email to avoid spam
    });
  }

  /**
   * User unlocked a new badge.
   */
  async onBadgeUnlocked(
    userId: string,
    email: string,
    badgeName: string,
    badgeIcon?: string,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Huy hiệu mới: ${badgeName} 🏆`,
      message: `Chúc mừng! Bạn đã mở khóa huy hiệu "${badgeName}". Tiếp tục phấn đấu để đạt thêm nhiều thành tích mới!`,
      type: NotificationType.BadgeUnlocked,
      actionUrl: '/achievements',
      metadata: { badgeName, badgeIcon },
      novuWorkflowId: 'badge-unlocked',
    });
  }

  // ─── Course & Assignment Events ────────────────────────────────────────────

  /**
   * A new assignment or lesson has been published in a course the user is enrolled in.
   */
  async onNewAssignment(
    userId: string,
    email: string,
    courseName: string,
    lessonTitle: string,
    courseId: string,
    lessonId: string,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Bài học mới: ${lessonTitle} 📚`,
      message: `Bài học "${lessonTitle}" trong khóa "${courseName}" đã sẵn sàng. Bắt đầu học ngay!`,
      type: NotificationType.NewAssignment,
      actionUrl: `/courses/${courseId}/lessons/${lessonId}`,
      metadata: { courseId, lessonId, courseName, lessonTitle },
      novuWorkflowId: 'new-assignment',
    });
  }

  /**
   * A new course has been published.
   */
  async onNewCourse(
    userId: string,
    email: string,
    courseName: string,
    courseId: string,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Khóa học mới: ${courseName} 🎓`,
      message: `Khóa học "${courseName}" vừa được xuất bản. Khám phá ngay!`,
      type: NotificationType.NewCourse,
      actionUrl: `/courses/${courseId}`,
      metadata: { courseId, courseName },
      novuWorkflowId: 'new-course',
    });
  }

  // ─── Exam & Study Events ──────────────────────────────────────────────────

  /**
   * Upcoming exam reminder.
   */
  async onExamReminder(
    userId: string,
    email: string,
    examTitle: string,
    examDate: Date,
    examId: string,
    firstName?: string,
  ): Promise<Notification> {
    const formattedDate = examDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Nhắc nhở thi: ${examTitle} ⏰`,
      message: `Bài thi "${examTitle}" sẽ diễn ra vào ${formattedDate}. Hãy chuẩn bị thật tốt!`,
      type: NotificationType.ExamReminder,
      actionUrl: `/exams/${examId}`,
      metadata: { examId, examTitle, examDate: examDate.toISOString() },
      novuWorkflowId: 'exam-reminder',
    });
  }

  /**
   * Quiz result is ready.
   */
  async onQuizResult(
    userId: string,
    email: string,
    quizTitle: string,
    score: number,
    totalQuestions: number,
    attemptId: string,
    firstName?: string,
  ): Promise<Notification> {
    const percentage = Math.round((score / totalQuestions) * 100);
    const emoji = percentage >= 80 ? '🌟' : percentage >= 50 ? '👍' : '💪';

    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Kết quả bài kiểm tra: ${percentage}% ${emoji}`,
      message: `Bạn đạt ${score}/${totalQuestions} câu đúng trong "${quizTitle}". ${percentage >= 80 ? 'Xuất sắc!' : 'Hãy ôn tập thêm nhé!'}`,
      type: NotificationType.QuizResult,
      actionUrl: `/quiz-attempts/${attemptId}`,
      metadata: { attemptId, quizTitle, score, totalQuestions, percentage },
      novuWorkflowId: 'quiz-result',
    });
  }

  // ─── Streak & Engagement Reminders ─────────────────────────────────────────

  /**
   * User hasn't studied today — streak at risk.
   */
  async onStreakReminder(
    userId: string,
    email: string,
    currentStreak: number,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Giữ streak ${currentStreak} ngày! 🔥`,
      message: `Bạn đang có chuỗi học ${currentStreak} ngày liên tiếp. Hãy hoàn thành ít nhất 1 bài học hôm nay để duy trì streak!`,
      type: NotificationType.StreakReminder,
      actionUrl: '/dashboard',
      metadata: { currentStreak },
      novuWorkflowId: 'streak-reminder',
    });
  }

  /**
   * User hasn't logged in for several days.
   */
  async onInactiveReminder(
    userId: string,
    email: string,
    daysSinceLastActivity: number,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Chúng tôi nhớ bạn! 😊`,
      message: `Đã ${daysSinceLastActivity} ngày kể từ lần cuối bạn học trên EduTech. Quay lại và tiếp tục hành trình học tập nhé!`,
      type: NotificationType.InactiveReminder,
      actionUrl: '/dashboard',
      metadata: { daysSinceLastActivity },
      novuWorkflowId: 'inactive-reminder',
    });
  }

  // ─── Payment & Subscription Events ─────────────────────────────────────────

  /**
   * Payment confirmed (subscription or one-time purchase).
   */
  async onPaymentConfirmed(
    userId: string,
    email: string,
    amount: number,
    planName: string,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `Thanh toán thành công! ✅`,
      message: `Thanh toán ${amount.toLocaleString('vi-VN')}đ cho gói "${planName}" đã được xác nhận. Cảm ơn bạn đã sử dụng EduTech!`,
      type: NotificationType.PaymentConfirmed,
      actionUrl: '/subscription',
      metadata: { amount, planName },
      novuWorkflowId: 'payment-confirmed',
    });
  }

  /**
   * Subscription status update (activated, expiring soon, expired).
   */
  async onSubscriptionUpdate(
    userId: string,
    email: string,
    planName: string,
    status: 'activated' | 'expiring_soon' | 'expired',
    expiryDate?: Date,
    firstName?: string,
  ): Promise<Notification> {
    const statusMessages = {
      activated: {
        title: `Gói ${planName} đã kích hoạt! 🎉`,
        message: `Bạn đã nâng cấp thành công lên gói "${planName}". Tận hưởng tất cả tính năng premium!`,
      },
      expiring_soon: {
        title: `Gói ${planName} sắp hết hạn ⚠️`,
        message: `Gói "${planName}" của bạn sẽ hết hạn vào ${expiryDate?.toLocaleDateString('vi-VN') ?? 'sắp tới'}. Gia hạn ngay để không bị gián đoạn!`,
      },
      expired: {
        title: `Gói ${planName} đã hết hạn 📋`,
        message: `Gói "${planName}" của bạn đã hết hạn. Gia hạn ngay để tiếp tục sử dụng các tính năng premium.`,
      },
    };

    const { title, message } = statusMessages[status];

    return this.sendNotification({
      userId,
      email,
      firstName,
      title,
      message,
      type: NotificationType.SubscriptionUpdate,
      actionUrl: '/subscription',
      metadata: {
        planName,
        status,
        expiryDate: expiryDate?.toISOString() ?? null,
      },
      novuWorkflowId: 'subscription-update',
    });
  }

  // ─── System & Admin Events ─────────────────────────────────────────────────

  /**
   * System-wide announcement (e.g., maintenance, new features).
   */
  async onSystemAnnouncement(
    userId: string,
    email: string,
    title: string,
    message: string,
    firstName?: string,
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: `📢 ${title}`,
      message,
      type: NotificationType.SystemAnnouncement,
      novuWorkflowId: 'system-announcement',
    });
  }

  /**
   * Parent-student link request or status update.
   */
  async onParentLinkUpdate(
    userId: string,
    email: string,
    parentOrStudentName: string,
    status: 'requested' | 'approved' | 'rejected',
    firstName?: string,
  ): Promise<Notification> {
    const statusMessages = {
      requested: {
        title: 'Yêu cầu liên kết phụ huynh 👨‍👩‍👧',
        message: `${parentOrStudentName} đã gửi yêu cầu liên kết tài khoản phụ huynh-học sinh.`,
      },
      approved: {
        title: 'Liên kết phụ huynh được chấp nhận ✅',
        message: `Liên kết tài khoản với ${parentOrStudentName} đã được chấp nhận.`,
      },
      rejected: {
        title: 'Liên kết phụ huynh bị từ chối ❌',
        message: `Yêu cầu liên kết tài khoản với ${parentOrStudentName} đã bị từ chối.`,
      },
    };

    const { title, message } = statusMessages[status];

    return this.sendNotification({
      userId,
      email,
      firstName,
      title,
      message,
      type: NotificationType.ParentLinkUpdate,
      actionUrl: '/parent-links',
      metadata: { parentOrStudentName, status },
      novuWorkflowId: 'parent-link-update',
    });
  }

  /**
   * Course approval status update (for teachers).
   */
  async onCourseApproval(
    userId: string,
    email: string,
    courseName: string,
    courseId: string,
    status: 'approved' | 'rejected',
    reason?: string,
    firstName?: string,
  ): Promise<Notification> {
    const isApproved = status === 'approved';
    return this.sendNotification({
      userId,
      email,
      firstName,
      title: isApproved
        ? `Khóa học "${courseName}" đã được duyệt ✅`
        : `Khóa học "${courseName}" bị từ chối ❌`,
      message: isApproved
        ? `Khóa học "${courseName}" đã được quản trị viên phê duyệt và sẵn sàng xuất bản.`
        : `Khóa học "${courseName}" không được duyệt. Lý do: ${reason ?? 'Không có lý do cụ thể.'}`,
      type: NotificationType.CourseApproval,
      actionUrl: `/courses/${courseId}`,
      metadata: { courseId, courseName, status, reason },
      novuWorkflowId: 'course-approval',
    });
  }
}
