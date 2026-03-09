import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../../mailer';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly appUrl: string;
  private readonly verificationTokenExpirationMinutes: number;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl =
      this.configService.get<string>('app.url') ?? 'http://localhost:3000';
    this.verificationTokenExpirationMinutes =
      this.configService.get<number>('mail.verificationTokenExpiresMinutes') ??
      24 * 60;
  }

  /**
   * Send verification email with token link
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string,
  ): Promise<void> {
    const verificationLink = `${this.appUrl}/api/v1/auth/email/verify?token=${token}`;

    const subject = '✓ Xác nhận Email - EduTech';
    const html = this.generateVerificationEmailHtml(
      firstName,
      verificationLink,
    );

    await this.mailerService.sendMail(email, subject, html);

    this.logger.log(`Verification email sent to ${email}`);
  }

  /**
   * Generate HTML template for verification email
   */
  private generateVerificationEmailHtml(
    firstName: string,
    verificationLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0a0a0a; background: #ffffff; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; }
            .title { font-size: 24px; letter-spacing: 0.02em; text-transform: uppercase; color: #0a0a0a; }
            .content { padding: 24px 0 16px; color: #1a1a1a; }
            .button { display: inline-block; padding: 12px 28px; border: 1px solid #0a0a0a; color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; letter-spacing: 0.01em; }
            .button:hover { background: #0a0a0a; color: #ffffff; }
            .link { word-break: break-all; color: #0a0a0a; font-size: 14px; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #4a4a4a; text-align: center; }
            .note { margin: 16px 0; padding: 12px 14px; border: 1px dashed #b3b3b3; color: #333; border-radius: 6px; background: #fafafa; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">EduTech</div>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Thanks for creating an account. Please confirm your email to activate access.</p>
              <p><a href="${verificationLink}" class="button">Verify Email</a></p>
              <div class="note">This link expires in 24 hours. If this wasn’t you, you can ignore this email.</div>
              <p>Need help? Just reply to this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} EduTech</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate verification token expiration date
   */
  generateVerificationTokenExpiry(): Date {
    const expiryDate = new Date();
    expiryDate.setMinutes(
      expiryDate.getMinutes() + this.verificationTokenExpirationMinutes,
    );
    return expiryDate;
  }

  /**
   * Check if verification token is expired
   */
  isTokenExpired(expiresAt: Date | string | null | undefined): boolean {
    if (!expiresAt) return true;
    const expiryDate =
      typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    if (!expiryDate || Number.isNaN(expiryDate.getTime())) return true;
    return new Date() > expiryDate;
  }

  /**
   * Send a 6-digit password-reset OTP to the user's registered email address.
   * The OTP expires in 10 minutes.
   */
  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    const subject = '🔐 Password Reset OTP — EduTech';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0a0a0a; background: #ffffff; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; }
            .title { font-size: 24px; letter-spacing: 0.02em; text-transform: uppercase; color: #0a0a0a; }
            .otp-box { text-align: center; margin: 24px 0; padding: 24px; background: #f5f5f5; border-radius: 8px; border: 1px dashed #ccc; }
            .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #0a0a0a; font-family: monospace; }
            .note { margin: 16px 0; padding: 12px 14px; border: 1px dashed #b3b3b3; color: #333; border-radius: 6px; background: #fafafa; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #4a4a4a; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">EduTech</div>
            </div>
            <p>You requested a password reset for your EduTech account.</p>
            <p>Enter the following OTP to verify your identity:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <div class="note">
              ⏱ This code expires in <strong>10 minutes</strong>.<br/>
              If you did not request a password reset, please ignore this email — your account remains secure.
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} EduTech</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Password reset OTP sent to ${email}`);
  }

  // ── Approval workflow emails ───────────────────────────────────────────────

  /**
   * Sent after a Teacher/Parent verifies their email, informing them
   * that their account is now awaiting admin review.
   */
  async sendPendingApprovalEmail(
    email: string,
    firstName: string,
    role: string,
  ): Promise<void> {
    const subject = '⏳ Account Under Review — EduTech';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0a0a0a; background: #ffffff; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; }
            .title { font-size: 24px; letter-spacing: 0.02em; text-transform: uppercase; color: #0a0a0a; }
            .note { margin: 16px 0; padding: 12px 14px; border: 1px dashed #b3b3b3; color: #333; border-radius: 6px; background: #fafafa; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #4a4a4a; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="title">EduTech</div></div>
            <p>Hi ${firstName},</p>
            <p>Your email has been verified. Your <strong>${role}</strong> account registration is currently under review by our admin team.</p>
            <div class="note">
              ⏱ We typically review new accounts within <strong>1–2 business days</strong>.<br/>
              You will receive an email once a decision has been made.
            </div>
            <p>In the meantime, please make sure your profile information (qualifications, documents, contact details) is complete, as this will help speed up the review.</p>
            <p>Questions? Reply to this email — we're happy to help.</p>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} EduTech</p></div>
          </div>
        </body>
      </html>
    `;
    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Pending-approval email sent to ${email}`);
  }

  /**
   * Sent when an admin approves a Teacher/Parent account.
   */
  async sendApprovalEmail(email: string, firstName: string): Promise<void> {
    const subject = '✅ Account Approved — EduTech';
    const loginUrl = `${this.appUrl}/api/v1/auth/email/login`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0a0a0a; background: #ffffff; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; }
            .title { font-size: 24px; letter-spacing: 0.02em; text-transform: uppercase; color: #0a0a0a; }
            .button { display: inline-block; padding: 12px 28px; border: 1px solid #0a0a0a; color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #4a4a4a; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="title">EduTech</div></div>
            <p>Hi ${firstName},</p>
            <p>🎉 Congratulations! Your account has been <strong>approved</strong> by our admin team.</p>
            <p>You can now log in and start using the platform:</p>
            <p><a href="${loginUrl}" class="button">Log In Now</a></p>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} EduTech</p></div>
          </div>
        </body>
      </html>
    `;
    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Approval email sent to ${email}`);
  }

  /**
   * Sent when an admin rejects a Teacher/Parent account.
   * Includes the rejection reason and instructions for resubmission.
   */
  async sendRejectionEmail(
    email: string,
    firstName: string,
    reason: string,
  ): Promise<void> {
    const subject = '❌ Account Not Approved — EduTech';
    const resubmitUrl = `${this.appUrl}/api/v1/auth/resubmit-approval`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0a0a0a; background: #ffffff; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; }
            .title { font-size: 24px; letter-spacing: 0.02em; text-transform: uppercase; color: #0a0a0a; }
            .reason-box { margin: 16px 0; padding: 12px 14px; border-left: 4px solid #cc0000; background: #fff5f5; border-radius: 0 6px 6px 0; color: #550000; }
            .note { margin: 16px 0; padding: 12px 14px; border: 1px dashed #b3b3b3; color: #333; border-radius: 6px; background: #fafafa; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #4a4a4a; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><div class="title">EduTech</div></div>
            <p>Hi ${firstName},</p>
            <p>We have reviewed your account application. Unfortunately, it was <strong>not approved</strong> at this time.</p>
            <div class="reason-box">
              <strong>Reason provided by the reviewer:</strong><br/>
              ${reason}
            </div>
            <div class="note">
              You can update your profile information and re-submit your application using the endpoint below. Our team will review it again.<br/><br/>
              <strong>Resubmit endpoint:</strong> <code>POST ${resubmitUrl}</code>
            </div>
            <p>If you believe this decision was made in error, please reply to this email with any supporting documentation.</p>
            <div class="footer"><p>&copy; ${new Date().getFullYear()} EduTech</p></div>
          </div>
        </body>
      </html>
    `;
    await this.mailerService.sendMail(email, subject, html);
    this.logger.log(`Rejection email sent to ${email}`);
  }
}
