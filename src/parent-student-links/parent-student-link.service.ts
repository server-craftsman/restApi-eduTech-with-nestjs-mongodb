import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ParentStudentLinkRepositoryAbstract } from './infrastructure/persistence/document/repositories/parent-student-link.repository.abstract';
import { ParentStudentLink } from './domain/parent-student-link';
import { StudentProfileService } from '../student-profiles/student-profile.service';
import { ParentProfileService } from '../parent-profiles/parent-profile.service';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { QuizAttemptService } from '../quiz-attempts/quiz-attempt.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { LinkedStudentDto } from './dto/linked-student.dto';
import { LinkedParentDto } from './dto/linked-parent.dto';
import { GenerateLinkCodeResponseDto } from './dto/generate-link-code-response.dto';
import { ShareCodeResponseDto } from './dto/share-code-response.dto';
import {
  StudentProgressReportDto,
  QuizAttemptSummaryDto,
} from './dto/student-progress-report.dto';
import { ReportPeriod } from './dto/progress-report-period.dto';
import { SmsService } from './services/messaging.service';
import { ZaloService } from './services/messaging.service';

@Injectable()
export class ParentStudentLinkService {
  private readonly logger = new Logger(ParentStudentLinkService.name);

  constructor(
    private readonly parentStudentLinkRepository: ParentStudentLinkRepositoryAbstract,
    private readonly studentProfileService: StudentProfileService,
    private readonly parentProfileService: ParentProfileService,
    private readonly lessonProgressService: LessonProgressService,
    private readonly quizAttemptService: QuizAttemptService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly smsService: SmsService,
    private readonly zaloService: ZaloService,
  ) {}

  // ─── Base CRUD ────────────────────────────────────────────────────────────

  async createLink(
    data: Omit<ParentStudentLink, 'id' | 'createdAt'>,
  ): Promise<ParentStudentLink> {
    return this.parentStudentLinkRepository.create(data);
  }

  async getLinkById(id: string): Promise<ParentStudentLink | null> {
    return this.parentStudentLinkRepository.findById(id);
  }

  async getAllLinks(): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findAll();
  }

  async updateLink(
    id: string,
    data: Partial<ParentStudentLink>,
  ): Promise<ParentStudentLink | null> {
    return this.parentStudentLinkRepository.update(id, data);
  }

  async deleteLink(id: string): Promise<void> {
    return this.parentStudentLinkRepository.delete(id);
  }

  async getStudentsByParentId(parentId: string): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findByParentId(parentId);
  }

  async getParentsByStudentId(studentId: string): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findByStudentId(studentId);
  }

  async getLinkByParentAndStudent(
    parentId: string,
    studentId: string,
  ): Promise<ParentStudentLink | null> {
    return this.parentStudentLinkRepository.findByParentAndStudent(
      parentId,
      studentId,
    );
  }

  async getVerifiedStudentsByParentId(
    parentId: string,
  ): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findVerifiedByParentId(parentId);
  }

  async getVerifiedParentsByStudentId(
    studentId: string,
  ): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findVerifiedByStudentId(studentId);
  }

  async verifyLink(id: string): Promise<ParentStudentLink | null> {
    return this.updateLink(id, { isVerified: true });
  }

  async filterLinks(
    filters: Partial<ParentStudentLink>,
  ): Promise<ParentStudentLink[]> {
    const allLinks = await this.getAllLinks();
    return allLinks.filter((link) => {
      if (filters.parentId && link.parentId !== filters.parentId) return false;
      if (filters.studentId && link.studentId !== filters.studentId)
        return false;
      if (
        filters.isVerified !== undefined &&
        link.isVerified !== filters.isVerified
      )
        return false;
      return true;
    });
  }

  // ─── Parent Linking Flow ──────────────────────────────────────────────────

  /**
   * Step 1 (Student): Generate a unique 8-character link code.
   * Creates an unverified link record associated with the student profile.
   * If an unexpired pending code already exists, it is returned as-is.
   */
  async generateLinkCode(
    studentUserId: string,
  ): Promise<GenerateLinkCodeResponseDto> {
    const studentProfile =
      await this.studentProfileService.getProfileByUserId(studentUserId);
    if (!studentProfile) {
      throw new BadRequestException('Student profile not found');
    }

    // Return existing unexpired code if present
    const existing =
      await this.parentStudentLinkRepository.findPendingByStudentId(
        studentProfile.id,
      );
    if (
      existing?.linkCode &&
      existing.linkCodeExpires &&
      existing.linkCodeExpires > new Date()
    ) {
      return {
        linkCode: existing.linkCode,
        expiresAt: existing.linkCodeExpires,
      };
    }

    const code = this.generateRandomCode(8);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.parentStudentLinkRepository.create({
      parentId: null,
      studentId: studentProfile.id,
      isVerified: false,
      linkCode: code,
      linkCodeExpires: expiresAt,
      lastReportSentAt: null,
    });

    return { linkCode: code, expiresAt };
  }

  /**
   * Step 1 extended: Returns the link code together with a pre-composed
   * Vietnamese share text suitable for sending over Zalo / SMS.
   */
  async getShareableCode(studentUserId: string): Promise<ShareCodeResponseDto> {
    const { linkCode, expiresAt } = await this.generateLinkCode(studentUserId);

    const studentProfile =
      await this.studentProfileService.getProfileByUserId(studentUserId);
    const studentName = studentProfile?.fullName ?? 'con bạn';

    const shareText =
      `📚 Mã kết nối EduTech của ${studentName}: *${linkCode}*\n` +
      `Bạn vui lòng mở ứng dụng EduTech → Phụ huynh → Nhập mã kết nối.\n` +
      `⏳ Mã hết hạn vào: ${new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(expiresAt)}.`;

    return { linkCode, expiresAt, shareText };
  }

  /**
   * Step 1.5 (Student): Send the link code to parent via SMS or Zalo
   * Automatically gets the shareable text and sends it via the chosen channel
   */
  async sendLinkCodeToParent(
    studentUserId: string,
    parentPhoneNumber: string,
    channel: 'sms' | 'zalo',
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Get the shareable code with pre-composed message
    const { shareText } = await this.getShareableCode(studentUserId);

    this.logger.log(
      `Sending ${channel.toUpperCase()} to ${parentPhoneNumber} with message: ${shareText}`,
    );

    if (channel === 'sms') {
      return this.smsService.sendSms(parentPhoneNumber, shareText);
    } else if (channel === 'zalo') {
      return this.zaloService.sendMessage(parentPhoneNumber, shareText);
    }

    throw new BadRequestException('Invalid channel. Use "sms" or "zalo"');
  }

  /**
   * Step 2 (Parent): Connect to a student using the link code.
   */
  async connectByCode(
    parentUserId: string,
    code: string,
  ): Promise<ParentStudentLink> {
    const parentProfile =
      await this.parentProfileService.getProfileByUserId(parentUserId);
    if (!parentProfile) {
      throw new BadRequestException('Parent profile not found');
    }

    const link = await this.parentStudentLinkRepository.findByLinkCode(code);
    if (!link) {
      throw new BadRequestException('Invalid link code');
    }
    if (link.isVerified) {
      throw new BadRequestException('This link code has already been used');
    }
    if (!link.linkCodeExpires || link.linkCodeExpires < new Date()) {
      throw new BadRequestException('Link code has expired');
    }

    const duplicate =
      await this.parentStudentLinkRepository.findByParentAndStudent(
        parentProfile.id,
        link.studentId,
      );
    if (duplicate && duplicate.isVerified) {
      throw new BadRequestException('You are already linked to this student');
    }

    const updated = await this.parentStudentLinkRepository.update(link.id, {
      parentId: parentProfile.id,
      isVerified: true,
      linkCode: null,
      linkCodeExpires: null,
    });

    return updated!;
  }

  /**
   * Returns all verified children with their student profile details.
   */
  async getMyChildren(parentUserId: string): Promise<LinkedStudentDto[]> {
    const parentProfile =
      await this.parentProfileService.getProfileByUserId(parentUserId);
    if (!parentProfile) return [];

    const links = await this.parentStudentLinkRepository.findVerifiedByParentId(
      parentProfile.id,
    );

    const results: LinkedStudentDto[] = [];
    for (const link of links) {
      const profile = await this.studentProfileService.getProfileById(
        link.studentId,
      );
      if (!profile) continue;
      results.push({
        linkId: link.id,
        studentProfileId: profile.id,
        fullName: profile.fullName,
        gradeLevel: profile.gradeLevel ?? null,
        schoolName: profile.schoolName ?? null,
        xpTotal: profile.xpTotal,
        currentStreak: profile.currentStreak,
        linkedAt: link.createdAt,
      });
    }
    return results;
  }

  /**
   * Returns all verified parents with their parent profile details.
   */
  async getMyParents(studentUserId: string): Promise<LinkedParentDto[]> {
    const studentProfile =
      await this.studentProfileService.getProfileByUserId(studentUserId);
    if (!studentProfile) return [];

    const links =
      await this.parentStudentLinkRepository.findVerifiedByStudentId(
        studentProfile.id,
      );

    const results: LinkedParentDto[] = [];
    for (const link of links) {
      if (!link.parentId) continue; // safety: skip orphaned links without a parent
      const profile = await this.parentProfileService.getProfileById(
        link.parentId,
      );
      if (!profile) continue;
      results.push({
        linkId: link.id,
        parentProfileId: profile.id,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        linkedAt: link.createdAt,
      });
    }
    return results;
  }

  // ─── Progress Reporting ───────────────────────────────────────────────────

  /**
   * Aggregates lesson and quiz activity for a student within the report period.
   *
   * @param studentProfileId - student_profiles._id
   * @param period           - 'weekly' (7 days) | 'monthly' (30 days)
   */
  async getStudentProgressReport(
    studentProfileId: string,
    period: ReportPeriod = ReportPeriod.Weekly,
  ): Promise<StudentProgressReportDto> {
    const studentProfile =
      await this.studentProfileService.getProfileById(studentProfileId);
    if (!studentProfile) {
      throw new BadRequestException('Student profile not found');
    }

    const periodDays = period === ReportPeriod.Weekly ? 7 : 30;
    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const studentUserId = studentProfile.userId;

    // Fetch raw data
    const [allLessonProgress, allQuizAttempts] = await Promise.all([
      this.lessonProgressService.findByUserId(studentUserId),
      this.quizAttemptService.getUserAttempts(studentUserId),
    ]);

    // Filter to period
    const periodLesson = allLessonProgress.filter((lp) => {
      const ts = new Date(lp.updatedAt ?? lp.createdAt);
      return ts >= periodStart && ts <= periodEnd;
    });

    const periodQuiz = allQuizAttempts.filter((qa) => {
      const ts = qa.submittedAt
        ? new Date(qa.submittedAt)
        : new Date(qa.createdAt);
      return ts >= periodStart && ts <= periodEnd;
    });

    // Lesson stats
    const lessonsStarted = periodLesson.length;
    const lessonsCompleted = periodLesson.filter((lp) => lp.isCompleted).length;
    const totalWatchMinutes = Math.round(
      periodLesson.reduce((sum, lp) => sum + (lp.lastWatchedSec ?? 0), 0) / 60,
    );

    // Quiz stats
    const quizzesAttempted = periodQuiz.length;
    const avgQuizScore =
      quizzesAttempted > 0
        ? periodQuiz.reduce((sum, qa) => sum + (qa.score ?? 0), 0) /
          quizzesAttempted
        : null;

    // XP estimate: 10 XP per completed lesson + 5 XP per correct quiz answer
    const xpEarnedThisPeriod =
      lessonsCompleted * 10 +
      periodQuiz.reduce((sum, qa) => sum + (qa.correctAnswers ?? 0) * 5, 0);

    // Build quiz summary list (most recent first, capped at 20)
    const quizAttempts: QuizAttemptSummaryDto[] = periodQuiz
      .sort((a, b) => {
        const aTs = a.submittedAt
          ? new Date(a.submittedAt).getTime()
          : new Date(a.createdAt).getTime();
        const bTs = b.submittedAt
          ? new Date(b.submittedAt).getTime()
          : new Date(b.createdAt).getTime();
        return bTs - aTs;
      })
      .slice(0, 20)
      .map((qa) => ({
        completedAt: qa.submittedAt ?? new Date(qa.createdAt),
        score: qa.score ?? 0,
        totalQuestions: qa.totalQuestions ?? 0,
        correctAnswers: qa.correctAnswers ?? 0,
      }));

    // Build a human-readable Vietnamese highlight
    const highlightText = this.buildHighlightText(
      studentProfile.fullName,
      lessonsCompleted,
      quizzesAttempted,
      avgQuizScore,
      period,
    );

    return {
      studentProfileId: studentProfile.id,
      fullName: studentProfile.fullName,
      gradeLevel: studentProfile.gradeLevel ?? null,
      schoolName: studentProfile.schoolName ?? null,
      xpTotal: studentProfile.xpTotal,
      currentStreak: studentProfile.currentStreak,
      diamondBalance: studentProfile.diamondBalance,
      periodStart,
      periodEnd,
      lessonsStarted,
      lessonsCompleted,
      totalWatchMinutes,
      quizzesAttempted,
      avgQuizScore,
      xpEarnedThisPeriod,
      quizAttempts,
      highlightText,
    };
  }

  /**
   * Sends a progress report email to the parent for a specific verified link.
   * Also stamps `lastReportSentAt` on the link for throttle tracking.
   */
  async sendProgressReportToParents(
    linkId: string,
    period: ReportPeriod = ReportPeriod.Weekly,
  ): Promise<void> {
    const link = await this.parentStudentLinkRepository.findById(linkId);
    if (!link || !link.isVerified || !link.parentId) {
      throw new BadRequestException('Verified link not found');
    }

    const [parentProfile, report] = await Promise.all([
      this.parentProfileService.getProfileById(link.parentId),
      this.getStudentProgressReport(link.studentId, period),
    ]);

    if (!parentProfile) {
      throw new BadRequestException('Parent profile not found');
    }

    const parentUser = await this.usersService.findById(parentProfile.userId);
    if (!parentUser?.email) {
      throw new BadRequestException('Parent user email not found');
    }

    await this.mailService.sendProgressReportEmail(
      parentUser.email,
      parentProfile.fullName,
      report.fullName,
      report,
      period,
    );

    // Stamp the last-sent time
    await this.parentStudentLinkRepository.update(linkId, {
      lastReportSentAt: new Date(),
    });
  }

  /**
   * Cron: every Monday at 08:00 — send weekly progress reports to all parents.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async sendAllWeeklyReports(): Promise<void> {
    this.logger.log('Cron: sending weekly progress reports…');

    const verifiedLinks =
      await this.parentStudentLinkRepository.findAllVerified();

    let sent = 0;
    let failed = 0;
    for (const link of verifiedLinks) {
      try {
        await this.sendProgressReportToParents(link.id, ReportPeriod.Weekly);
        sent++;
      } catch (err) {
        failed++;
        this.logger.error(
          `Failed to send weekly report for link ${link.id}: ${String(err)}`,
        );
      }
    }

    this.logger.log(`Weekly reports done — sent: ${sent}, failed: ${failed}`);
  }

  /**
   * Allows either party (student or parent) to revoke the link.
   * Validates that the requesting user is a party to the link.
   */
  async revokeLink(linkId: string, requestingUserId: string): Promise<void> {
    const link = await this.parentStudentLinkRepository.findById(linkId);
    if (!link) {
      throw new BadRequestException('Link not found');
    }

    // Resolve which profile IDs belong to the requesting user
    const [studentProfile, parentProfile] = await Promise.all([
      this.studentProfileService.getProfileByUserId(requestingUserId),
      this.parentProfileService.getProfileByUserId(requestingUserId),
    ]);

    const isStudent =
      studentProfile !== null && link.studentId === studentProfile.id;
    const isParent =
      parentProfile !== null && link.parentId === parentProfile.id;

    if (!isStudent && !isParent) {
      throw new BadRequestException(
        'You are not a party to this link and cannot revoke it',
      );
    }

    await this.parentStudentLinkRepository.delete(linkId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private buildHighlightText(
    studentName: string,
    lessonsCompleted: number,
    quizzesAttempted: number,
    avgQuizScore: number | null,
    period: ReportPeriod,
  ): string {
    const periodLabel = period === ReportPeriod.Weekly ? 'tuần' : 'tháng';
    const parts: string[] = [];

    if (lessonsCompleted > 0) {
      parts.push(`hoàn thành ${lessonsCompleted} bài học`);
    }
    if (quizzesAttempted > 0) {
      const scoreStr =
        avgQuizScore !== null ? ` (điểm TB ${avgQuizScore.toFixed(0)}%)` : '';
      parts.push(`làm ${quizzesAttempted} bài kiểm tra${scoreStr}`);
    }

    if (parts.length === 0) {
      return `${studentName} chưa có hoạt động học tập trong ${periodLabel} vừa qua. Hãy động viên bé học mỗi ngày nhé! 🌟`;
    }

    return `Trong ${periodLabel} vừa qua, ${studentName} đã ${parts.join(' và ')}. Thật tuyệt vời! 🎉`;
  }
}
