import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  SendSmsRequest,
  SendSmsResponse,
  SendZaloRequest,
  SendZaloResponse,
} from '../interfaces/messaging-provider.interface';

/**
 * SMS Service — send SMS via provider (e.g., Vonage/Nexmo, Twilio)
 * For this example, we use a generic HTTP API; configure in .env
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsApiKey: string;
  private readonly smsApiUrl: string;
  private readonly smsFromNumber: string;

  constructor(private configService: ConfigService) {
    this.smsApiKey = this.configService.get<string>('SMS_API_KEY') || '';
    this.smsApiUrl = this.configService.get<string>('SMS_API_URL') || '';
    this.smsFromNumber =
      this.configService.get<string>('SMS_FROM_NUMBER') || 'EduTech';
  }

  /**
   * Send SMS to phone number
   * @param to - Recipient phone number (E.164 format, e.g., +84901234567)
   * @param message - Message content
   */
  async sendSms(to: string, message: string): Promise<SendSmsResponse> {
    try {
      // If SMS API not configured, log and return success (for development)
      if (!this.smsApiKey || !this.smsApiUrl) {
        this.logger.warn(
          `SMS not configured. Skipping SMS to ${to}: ${message}`,
        );
        return { success: true, messageId: 'DEV_MODE' };
      }

      const payload: SendSmsRequest = { to, message };

      const response: AxiosResponse = await axios.post(
        this.smsApiUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.smsApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      const data = response.data as Record<string, unknown>;
      const messageId = (data.messageId || data.id) as string | undefined;
      this.logger.debug(
        `SMS sent successfully to ${to}, messageId: ${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS send failed',
      };
    }
  }
}

/**
 * Zalo Service — send messages via Zalo OA (Official Account)
 * Requires Zalo Business Account + Official Account setup
 */
@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);
  private readonly zaloAccessToken: string;
  private readonly zaloApiUrl: string =
    'https://openapi.zalo.me/v2.0/oa/message/send';

  constructor(private configService: ConfigService) {
    this.zaloAccessToken =
      this.configService.get<string>('ZALO_ACCESS_TOKEN') || '';
  }

  /**
   * Send message via Zalo OA to user's phone number
   * @param phoneNumber - User's phone number (E.164 format)
   * @param message - Message content
   */
  async sendMessage(
    phoneNumber: string,
    message: string,
  ): Promise<SendZaloResponse> {
    try {
      // If Zalo not configured, log and return success (for development)
      if (!this.zaloAccessToken) {
        this.logger.warn(
          `Zalo not configured. Skipping Zalo message to ${phoneNumber}: ${message}`,
        );
        return { success: true, messageId: 'DEV_MODE' };
      }

      const payload: SendZaloRequest = { phoneNumber, message };

      const response: AxiosResponse = await axios.post(
        this.zaloApiUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.zaloAccessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      const data = response.data as Record<string, unknown>;
      const messageId = (data.messageId || data.id) as string | undefined;
      this.logger.debug(
        `Zalo message sent successfully to ${phoneNumber}, messageId: ${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send Zalo message to ${phoneNumber}:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Zalo send failed',
      };
    }
  }
}
