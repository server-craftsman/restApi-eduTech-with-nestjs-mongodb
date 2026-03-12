import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Novu } from '@novu/node';
import { NotificationType } from '../../enums';

/**
 * Payload for triggering a Novu workflow.
 */
export interface NovuTriggerPayload {
  /** Novu workflow identifier (must match workflow created in Novu dashboard) */
  workflowId: string;
  /** Recipient user ID (used to build Novu subscriberId) */
  userId: string;
  /** Recipient email (for email channel) */
  email: string;
  /** Recipient display name */
  firstName?: string;
  /** Notification title */
  title: string;
  /** Notification body message */
  message: string;
  /** Notification type */
  type: NotificationType;
  /** Deep link URL for mobile/web */
  actionUrl?: string;
  /** Extra data passed to Novu template */
  metadata?: Record<string, unknown>;
}

/**
 * NovuService — wraps Novu SDK to trigger multi-channel notifications.
 *
 * Channels configured in Novu dashboard:
 * - In-App (real-time feed)
 * - Email (via SMTP integration configured in Novu)
 *
 * If NOVU_API_KEY is not set, notifications are logged but not sent,
 * allowing development without a Novu account.
 */
@Injectable()
export class NovuService implements OnModuleInit {
  private readonly logger = new Logger(NovuService.name);
  private novu: Novu | null = null;
  private readonly subscriberPrefix: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('novu.apiKey') || '';
    this.subscriberPrefix =
      this.configService.get<string>('novu.subscriberIdPrefix') || 'edutech_';
  }

  onModuleInit() {
    if (this.apiKey) {
      this.novu = new Novu(this.apiKey);
      this.logger.log('Novu SDK initialized — multi-channel notifications enabled');
    } else {
      this.logger.warn(
        'NOVU_API_KEY not set — notifications will be stored locally only. ' +
          'Set NOVU_API_KEY to enable push + email via Novu.',
      );
    }
  }

  /**
   * Build the Novu subscriberId from our internal userId.
   * Prefix ensures uniqueness across environments.
   */
  getSubscriberId(userId: string): string {
    return `${this.subscriberPrefix}${userId}`;
  }

  /**
   * Create or update a subscriber in Novu.
   * Should be called when a user signs up or updates their profile.
   */
  async upsertSubscriber(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ): Promise<void> {
    if (!this.novu) return;

    try {
      const subscriberId = this.getSubscriberId(userId);
      await this.novu.subscribers.identify(subscriberId, {
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
      this.logger.debug(`Novu subscriber upserted: ${subscriberId}`);
    } catch (error: unknown) {
      // Subscriber may already exist — that's fine
      this.logger.debug(
        `Novu subscriber upsert (may already exist): ${(error as Error).message}`,
      );
    }
  }

  /**
   * Trigger a Novu workflow — sends notification to all configured channels.
   *
   * @returns Novu transaction ID (or null if Novu is not configured)
   */
  async triggerWorkflow(payload: NovuTriggerPayload): Promise<string | null> {
    if (!this.novu) {
      this.logger.debug(
        `[DRY-RUN] Novu workflow "${payload.workflowId}" for user ${payload.userId}: ${payload.title}`,
      );
      return null;
    }

    try {
      const subscriberId = this.getSubscriberId(payload.userId);

      // Ensure subscriber exists
      await this.upsertSubscriber(
        payload.userId,
        payload.email,
        payload.firstName,
      );

      const result = await this.novu.trigger(payload.workflowId, {
        to: { subscriberId, email: payload.email },
        payload: {
          title: payload.title,
          message: payload.message,
          type: payload.type,
          actionUrl: payload.actionUrl || '',
          metadata: payload.metadata || {},
          firstName: payload.firstName || '',
          appName: 'EduTech',
        },
      });

      const transactionId =
        (result?.data as Record<string, unknown>)?.transactionId as string ?? null;

      this.logger.log(
        `Novu workflow "${payload.workflowId}" triggered for ${subscriberId} — txId: ${transactionId}`,
      );

      return transactionId;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to trigger Novu workflow "${payload.workflowId}" for user ${payload.userId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Check if Novu is configured and ready.
   */
  isEnabled(): boolean {
    return this.novu !== null;
  }
}
