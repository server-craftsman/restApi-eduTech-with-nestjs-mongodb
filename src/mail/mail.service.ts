import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../mailer/mailer.service';
import { StudentProgressReportDto } from '../parent-student-links/dto/student-progress-report.dto';
import { ReportPeriod } from '../parent-student-links/dto/progress-report-period.dto';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private appUrl: string;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.appUrl =
      this.configService.get<string>('app.url') || 'http://localhost:3000';
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = 'Chào mừng bạn đến với EduTech!';
    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .email-wrapper { background: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; color: #ffffff; }
            .logo { font-size: 32px; font-weight: 700; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2c3e50; margin: 0 0 20px 0; font-weight: 600; }
            .description { font-size: 15px; color: #555; line-height: 1.8; margin: 0 0 20px 0; }
            .cta-button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">🎓 EduTech</div>
              </div>
              <div class="content">
                <p class="greeting">Xin chào ${firstName}!</p>
                <p class="description">
                  Chúc mừng bạn đã xác nhận email thành công! Tài khoản EduTech của bạn đã hoàn toàn sẵn sàng sử dụng.
                </p>
                <p class="description">
                  Bắt đầu hành trình học tập của bạn ngay hôm nay và truy cập hàng ngàn khóa học chất lượng cao từ các giảng viên hàng đầu.
                </p>
                <p class="description">
                  Nếu bạn có bất kỳ câu hỏi, hãy liên hệ với chúng tôi qua email hoặc truy cập trung tâm trợ giúp của chúng tôi.
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} EduTech - Nền tảng học tập thông minh</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Welcome email sent to ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const subject = 'Đặt lại mật khẩu - EduTech';
    const resetUrl = `${this.appUrl}/reset-password?token=${resetToken}`;
    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .email-wrapper { background: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; color: #ffffff; }
            .logo { font-size: 32px; font-weight: 700; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2c3e50; margin: 0 0 20px 0; font-weight: 600; }
            .description { font-size: 15px; color: #555; line-height: 1.8; margin: 0 0 20px 0; }
            .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .warning-box p { margin: 0; font-size: 14px; color: #856404; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">EduTech</div>
              </div>
              <div class="content">
                <p class="greeting">Xin chào!</p>
                <p class="description">
                  Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản EduTech của bạn.
                </p>
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
                <div class="warning-box">
                  <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hạn trong 1 giờ. Nếu bạn không yêu cầu điều này, vui lòng bỏ qua.</p>
                </div>
                <p class="description">
                  Liên kết không hoạt động? Sao chép URL bên dưới vào trình duyệt:<br>
                  <small style="word-break: break-all;">${resetUrl}</small>
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} EduTech - Nền tảng học tập thông minh</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Password reset email sent to ${email}`);
  }

  async sendEmailVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void> {
    const subject = '✓ Xác nhận Email - EduTech';
    const verifyUrl = `${this.appUrl}/api/v1/email/verify?token=${verificationToken}`;
    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .email-wrapper { background: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; color: #ffffff; }
            .logo { font-size: 32px; font-weight: 700; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2c3e50; margin: 0 0 20px 0; font-weight: 600; }
            .description { font-size: 15px; color: #555; line-height: 1.8; margin: 0 0 20px 0; }
            .button { display: inline-block; padding: 15px 45px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 25px 0; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">EduTech</div>
              </div>
              <div class="content">
                <p class="greeting">Xác nhận email của bạn!</p>
                <p class="description">
                  Nhấp vào nút bên dưới để xác nhận địa chỉ email của bạn và kích hoạt tài khoản EduTech.
                </p>
                <a href="${verifyUrl}" class="button">✓ Xác nhận Email</a>
                <p class="description" style="font-size: 13px; color: #888;">
                  Liên kết này sẽ hết hạn trong 24 giờ.
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} EduTech - Nền tảng học tập thông minh</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Email verification sent to ${email}`);
  }

  /**
   * Sends a rich Vietnamese progress-report email to a parent.
   * Called by the weekly/monthly cron job and also on-demand from the API.
   */
  async sendProgressReportEmail(
    parentEmail: string,
    parentName: string,
    studentName: string,
    report: StudentProgressReportDto,
    period: ReportPeriod = ReportPeriod.Weekly,
  ): Promise<void> {
    const periodLabel = period === ReportPeriod.Weekly ? 'tuần' : 'tháng';
    const periodEmoji = period === ReportPeriod.Weekly ? '📅' : '📆';

    const subject = `${periodEmoji} Báo cáo học tập ${periodLabel} của ${studentName} - EduTech`;

    // Format helpers
    const formatDate = (d: Date): string =>
      new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);

    const avgScoreText =
      report.avgQuizScore !== null && report.avgQuizScore !== undefined
        ? `${report.avgQuizScore.toFixed(1)}%`
        : 'Chưa làm bài';

    // Build quiz attempt rows
    const quizRows =
      report.quizAttempts.length > 0
        ? report.quizAttempts
            .slice(0, 10) // cap table at 10 rows
            .map(
              (q) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${formatDate(new Date(q.completedAt))}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${q.correctAnswers}/${q.totalQuestions}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; font-weight: 600; color: ${q.score >= 70 ? '#27ae60' : '#e74c3c'};">${q.score.toFixed(0)}%</td>
          </tr>`,
            )
            .join('')
        : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #aaa;">Chưa có bài kiểm tra trong kỳ này</td></tr>`;

    // XP progress bar (cap at 500 xp for visual)
    const xpBarWidth = Math.min(
      100,
      Math.round((report.xpEarnedThisPeriod / 500) * 100),
    );

    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: #f4f6fb; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
            .email-wrapper { background: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; }
            .header { background: linear-gradient(135deg, #6c63ff 0%, #3b82f6 100%); padding: 48px 32px 36px; text-align: center; color: #ffffff; }
            .header-icon { font-size: 48px; margin-bottom: 12px; display: block; }
            .header-title { font-size: 26px; font-weight: 700; margin: 0 0 6px; }
            .header-sub { font-size: 15px; opacity: 0.85; margin: 0; }
            .content { padding: 36px 32px; }
            .greeting { font-size: 16px; color: #555; margin: 0 0 24px; }
            .highlight-box { background: linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%); border-left: 5px solid #6c63ff; padding: 18px 22px; border-radius: 8px; margin-bottom: 28px; font-size: 15px; color: #333; font-style: italic; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
            .stat-card { background: #f8faff; border-radius: 12px; padding: 18px 14px; text-align: center; border: 1px solid #e8edf5; }
            .stat-value { font-size: 28px; font-weight: 700; color: #6c63ff; }
            .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
            .section-title { font-size: 16px; font-weight: 700; color: #333; margin: 28px 0 14px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }
            .xp-bar-bg { background: #e8edf5; border-radius: 999px; height: 14px; margin-bottom: 6px; overflow: hidden; }
            .xp-bar-fill { background: linear-gradient(90deg, #6c63ff, #3b82f6); border-radius: 999px; height: 100%; }
            .xp-label { font-size: 13px; color: #666; text-align: right; margin-bottom: 20px; }
            .profile-meta { background: #f8faff; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 14px; color: #555; }
            .profile-meta table { width: 100%; border-collapse: collapse; }
            .profile-meta td { padding: 4px 0; }
            .profile-meta td:first-child { font-weight: 600; color: #333; width: 40%; }
            .quiz-table { width: 100%; border-collapse: collapse; font-size: 14px; border-radius: 8px; overflow: hidden; border: 1px solid #e8edf5; }
            .quiz-table th { background: #6c63ff; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
            .quiz-table tr:hover td { background: #f8faff; }
            .footer { background: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #aaa; }
            @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <!-- HEADER -->
              <div class="header">
                <span class="header-icon">📊</span>
                <p class="header-title">Báo cáo học tập ${periodLabel}</p>
                <p class="header-sub">${formatDate(new Date(report.periodStart))} – ${formatDate(new Date(report.periodEnd))}</p>
              </div>

              <div class="content">
                <p class="greeting">Kính gửi <strong>${parentName}</strong>,</p>
                <p class="greeting">Dưới đây là tổng hợp kết quả học tập <strong>${periodLabel} vừa qua</strong> của <strong>${studentName}</strong> trên nền tảng EduTech.</p>

                <!-- HIGHLIGHT -->
                <div class="highlight-box">💬 ${report.highlightText}</div>

                <!-- PROFILE INFO -->
                <div class="profile-meta">
                  <table>
                    <tr><td>Họ và tên</td><td>${report.fullName}</td></tr>
                    ${report.gradeLevel ? `<tr><td>Khối lớp</td><td>${report.gradeLevel}</td></tr>` : ''}
                    ${report.schoolName ? `<tr><td>Trường</td><td>${report.schoolName}</td></tr>` : ''}
                  </table>
                </div>

                <!-- PERIOD STATS -->
                <div class="section-title">📈 Hoạt động trong kỳ</div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${report.lessonsStarted}</div>
                    <div class="stat-label">Bài đã mở</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${report.lessonsCompleted}</div>
                    <div class="stat-label">Bài hoàn thành</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${report.totalWatchMinutes}</div>
                    <div class="stat-label">Phút xem video</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${report.quizzesAttempted}</div>
                    <div class="stat-label">Bài kiểm tra</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${avgScoreText}</div>
                    <div class="stat-label">Điểm TB quiz</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">+${report.xpEarnedThisPeriod}</div>
                    <div class="stat-label">XP kiếm được</div>
                  </div>
                </div>

                <!-- XP PROGRESS BAR -->
                <div class="section-title">⚡ XP kiếm được trong kỳ</div>
                <div class="xp-bar-bg">
                  <div class="xp-bar-fill" style="width: ${xpBarWidth}%;"></div>
                </div>
                <div class="xp-label">${report.xpEarnedThisPeriod} XP</div>

                <!-- CUMULATIVE STATS -->
                <div class="section-title">🏆 Tích lũy toàn thời gian</div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${report.xpTotal}</div>
                    <div class="stat-label">Tổng XP</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">🔥 ${report.currentStreak}</div>
                    <div class="stat-label">Chuỗi ngày học</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">💎 ${report.diamondBalance}</div>
                    <div class="stat-label">Kim cương</div>
                  </div>
                </div>

                <!-- QUIZ TABLE -->
                <div class="section-title">📝 Chi tiết bài kiểm tra</div>
                <table class="quiz-table">
                  <thead>
                    <tr>
                      <th>Ngày làm</th>
                      <th style="text-align: center;">Đúng/Tổng</th>
                      <th style="text-align: center;">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${quizRows}
                  </tbody>
                </table>
              </div>

              <div class="footer">
                <p>Email này được gửi tự động bởi hệ thống EduTech. Để ngừng nhận báo cáo, hãy xóa liên kết phụ huynh trong ứng dụng.</p>
                <p>&copy; ${new Date().getFullYear()} EduTech – Nền tảng học tập thông minh</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.mailerService.sendMail(parentEmail, subject, html);
    this.logger.log(
      `Progress report email (${period}) sent to ${parentEmail} for student ${studentName}`,
    );
  }

  /**
   * Send a generic notification email (used as fallback when Novu is not enabled).
   * @param email - Recipient email
   * @param title - Notification title
   * @param message - Notification body text
   * @param actionUrl - Optional deep link / CTA URL
   */
  async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<void> {
    const subject = `${title} — EduTech`;
    const ctaBlock = actionUrl
      ? `<p style="text-align: center; margin: 30px 0;">
           <a href="${this.appUrl}${actionUrl}" class="cta-button">Xem chi tiết →</a>
         </p>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .email-wrapper { background: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: #ffffff; }
            .logo { font-size: 28px; font-weight: 700; margin: 0; }
            .content { padding: 30px; }
            .title { font-size: 20px; font-weight: 700; color: #2c3e50; margin: 0 0 15px 0; }
            .message { font-size: 15px; color: #555; line-height: 1.8; margin: 0 0 20px 0; }
            .cta-button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">🔔 EduTech</div>
              </div>
              <div class="content">
                <p class="title">${title}</p>
                <p class="message">${message}</p>
                ${ctaBlock}
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} EduTech — Nền tảng học tập thông minh</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Notification email sent to ${email}: "${title}"`);
  }
}
