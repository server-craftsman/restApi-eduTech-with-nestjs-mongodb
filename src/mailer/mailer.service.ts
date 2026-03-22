import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailerService {
  private logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const service = this.configService.get<string>('mail.service');
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const secure = this.configService.get<boolean>('mail.secure') === true;
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!user || !pass) {
      // Fallback to JSON transport in development when SMTP is not configured
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn('SMTP env not set; using JSON transport for emails');
      return;
    }

    const smtpConfig: SMTPTransport.Options = service
      ? {
          service,
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
        };

    if (!service && !host) {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn('SMTP host is missing; using JSON transport for emails');
      return;
    }

    this.transporter = nodemailer.createTransport(smtpConfig);
    this.logger.debug(
      `Mailer transporter initialized (${service ? `service=${service}` : `host=${host}, port=${port}, secure=${secure}`})`,
    );
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter is not initialized');
      }

      const from =
        this.configService.get<string>('mail.fromEmail') ||
        this.configService.get<string>('mail.user');

      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
